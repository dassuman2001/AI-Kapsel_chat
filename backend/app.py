from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import uuid
import datetime
import os

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Supabase PostgreSQL Connection Details
DB_HOST = "db.qjhlkmcozyfhmlmgvjdu.supabase.co"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "83z$*+wvahfWfh%"
DB_PORT = "5432"

def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        port=DB_PORT,
        sslmode='require'
    )
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Create tables if they don't exist
    # Note: We use TEXT for simplicity to match the previous SQLite schema structure
    
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (id TEXT PRIMARY KEY, 
                  name TEXT, 
                  mobile_number TEXT UNIQUE, 
                  password TEXT, 
                  avatar TEXT, 
                  status TEXT, 
                  last_seen TEXT)''')
                  
    c.execute('''CREATE TABLE IF NOT EXISTS chats 
                 (id TEXT PRIMARY KEY, 
                  is_group BOOLEAN, 
                  group_name TEXT, 
                  group_avatar TEXT)''')
                  
    c.execute('''CREATE TABLE IF NOT EXISTS participants 
                 (chat_id TEXT, 
                  user_id TEXT, 
                  PRIMARY KEY (chat_id, user_id))''')
                  
    c.execute('''CREATE TABLE IF NOT EXISTS messages 
                 (id TEXT PRIMARY KEY, 
                  chat_id TEXT, 
                  sender_id TEXT, 
                  content TEXT, 
                  type TEXT, 
                  status TEXT, 
                  timestamp TEXT)''')
    
    conn.commit()
    c.close()
    conn.close()

# Initialize DB tables on startup
try:
    init_db()
    print("Database connected and initialized successfully.")
except Exception as e:
    print(f"Error initializing database: {e}")

# --- Helper to convert Postgres rows to Dict ---
def get_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

# --- Routes ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    conn = get_db_connection()
    c = get_cursor(conn)
    user_id = str(uuid.uuid4())
    avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={data['name']}"
    
    try:
        c.execute("INSERT INTO users (id, name, mobile_number, password, avatar, status, last_seen) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                  (user_id, data['name'], data['mobile_number'], data['password'], avatar, 'online', datetime.datetime.now().isoformat()))
        conn.commit()
        return jsonify({"id": user_id, "name": data['name'], "mobileNumber": data['mobile_number'], "avatar": avatar, "status": "online"}), 201
    except psycopg2.IntegrityError:
        conn.rollback()
        return jsonify({"error": "Mobile number already registered"}), 400
    except Exception as e:
        conn.rollback()
        print(e)
        return jsonify({"error": str(e)}), 500
    finally:
        c.close()
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db_connection()
    c = get_cursor(conn)
    
    c.execute("SELECT * FROM users WHERE mobile_number = %s AND password = %s", (data['mobile_number'], data['password']))
    user = c.fetchone()
    
    c.close()
    conn.close()
    
    if user:
        return jsonify({
            "id": user['id'],
            "name": user['name'],
            "mobileNumber": user['mobile_number'],
            "avatar": user['avatar'],
            "status": user['status'],
            "lastSeen": user['last_seen']
        })
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/users', methods=['GET'])
def get_users():
    current_user_id = request.args.get('current_user_id')
    conn = get_db_connection()
    c = get_cursor(conn)
    
    c.execute("SELECT id, name, mobile_number, avatar, status, last_seen FROM users WHERE id != %s", (current_user_id,))
    rows = c.fetchall()
    
    c.close()
    conn.close()
    
    users = []
    for u in rows:
        users.append({
            "id": u['id'],
            "name": u['name'],
            "mobileNumber": u['mobile_number'],
            "avatar": u['avatar'],
            "status": u['status'],
            "lastSeen": u['last_seen']
        })
    return jsonify(users)

@app.route('/api/chats', methods=['GET'])
def get_chats():
    user_id = request.args.get('user_id')
    conn = get_db_connection()
    c = get_cursor(conn)
    
    # Get all chat IDs for user
    c.execute("SELECT chat_id FROM participants WHERE user_id = %s", (user_id,))
    chat_rows = c.fetchall()
    chat_ids = [row['chat_id'] for row in chat_rows]
    
    if not chat_ids:
        c.close()
        conn.close()
        return jsonify([])

    # Postgres needs tuple for IN clause
    chat_ids_tuple = tuple(chat_ids)
    
    # Get Chat Details
    c.execute("SELECT * FROM chats WHERE id IN %s", (chat_ids_tuple,))
    chats_data = c.fetchall()
    
    # Get Participants
    c.execute("SELECT * FROM participants WHERE chat_id IN %s", (chat_ids_tuple,))
    parts_data = c.fetchall()
    
    # Get Messages
    c.execute("SELECT * FROM messages WHERE chat_id IN %s ORDER BY timestamp DESC", (chat_ids_tuple,))
    msgs_data = c.fetchall()
    
    c.close()
    conn.close()
    
    results = []
    for chat_row in chats_data:
        chat_id = chat_row['id']
        parts = [p['user_id'] for p in parts_data if p['chat_id'] == chat_id]
        
        # Find last message manually
        last_msg = next((m for m in msgs_data if m['chat_id'] == chat_id), None)
        formatted_last_msg = None
        if last_msg:
            formatted_last_msg = {
                "id": last_msg['id'],
                "chatId": last_msg['chat_id'],
                "senderId": last_msg['sender_id'],
                "content": last_msg['content'],
                "type": last_msg['type'],
                "status": last_msg['status'],
                "timestamp": last_msg['timestamp']
            }

        results.append({
            "id": chat_id,
            "isGroup": bool(chat_row['is_group']),
            "groupName": chat_row['group_name'],
            "groupAvatar": chat_row['group_avatar'],
            "participants": parts,
            "unreadCount": 0, 
            "lastMessage": formatted_last_msg
        })
        
    return jsonify(results)

@app.route('/api/chats', methods=['POST'])
def create_chat():
    data = request.json
    conn = get_db_connection()
    c = get_cursor(conn)
    
    # Check if direct chat exists
    if not data.get('isGroup'):
        my_id = data['participants'][0]
        other_id = data['participants'][1]
        
        c.execute("""
            SELECT p1.chat_id FROM participants p1 
            JOIN participants p2 ON p1.chat_id = p2.chat_id 
            JOIN chats c ON p1.chat_id = c.id
            WHERE p1.user_id = %s AND p2.user_id = %s AND c.is_group = FALSE
        """, (my_id, other_id))
        existing = c.fetchone()
        if existing:
            c.close()
            conn.close()
            return jsonify({"id": existing['chat_id']})

    chat_id = str(uuid.uuid4())
    is_group = data.get('isGroup', False)
    group_name = data.get('groupName')
    
    try:
        c.execute("INSERT INTO chats (id, is_group, group_name, group_avatar) VALUES (%s, %s, %s, %s)",
                  (chat_id, is_group, group_name, None))
        
        for uid in data['participants']:
            c.execute("INSERT INTO participants (chat_id, user_id) VALUES (%s, %s)", (chat_id, uid))
            
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(e)
        return jsonify({"error": "Failed to create chat"}), 500
    finally:
        c.close()
        conn.close()
        
    return jsonify({"id": chat_id, "isGroup": is_group, "participants": data['participants']})

@app.route('/api/messages', methods=['GET'])
def get_messages():
    chat_id = request.args.get('chat_id')
    conn = get_db_connection()
    c = get_cursor(conn)
    
    c.execute("SELECT * FROM messages WHERE chat_id = %s ORDER BY timestamp ASC", (chat_id,))
    rows = c.fetchall()
    
    c.close()
    conn.close()
    
    msgs = []
    for r in rows:
        msgs.append({
            "id": r['id'],
            "chatId": r['chat_id'],
            "senderId": r['sender_id'],
            "content": r['content'],
            "type": r['type'],
            "status": r['status'],
            "timestamp": r['timestamp']
        })
    return jsonify(msgs)

@app.route('/api/messages', methods=['POST'])
def send_message():
    data = request.json
    msg_id = str(uuid.uuid4())
    timestamp = datetime.datetime.now().isoformat()
    
    conn = get_db_connection()
    c = get_cursor(conn)
    
    try:
        c.execute("INSERT INTO messages (id, chat_id, sender_id, content, type, status, timestamp) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                  (msg_id, data['chatId'], data['senderId'], data['content'], data['type'], 'sent', timestamp))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(e)
        return jsonify({"error": "Failed to send message"}), 500
    finally:
        c.close()
        conn.close()
    
    msg_obj = {
        "id": msg_id,
        "chatId": data['chatId'],
        "senderId": data['senderId'],
        "content": data['content'],
        "type": data['type'],
        "status": 'sent',
        "timestamp": timestamp
    }
    
    # Emit socket event
    socketio.emit('new_message', msg_obj, room=data['chatId'])
    
    return jsonify(msg_obj)

@app.route('/api/profile', methods=['PUT'])
def update_profile():
    data = request.json
    conn = get_db_connection()
    c = get_cursor(conn)
    try:
        c.execute("UPDATE users SET name = %s WHERE id = %s", (data['name'], data['id']))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        c.close()
        conn.close()

# --- Socket Events ---
@socketio.on('join')
def on_join(data):
    room = data['chat_id']
    join_room(room)
    print(f"User joined room: {room}")

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
