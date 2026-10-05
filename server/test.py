import psycopg2

DB_CONFIG = {
    "dbname": "RahulDB",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432",
}

CREATE_TABLE_QUERY = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
"""


def create_table():
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(CREATE_TABLE_QUERY)
        conn.commit()
        cur.close()
        print("Connected to RahulDB and created 'users' table successfully.")
    except Exception as e:
        print("Error:", e)
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    create_table()