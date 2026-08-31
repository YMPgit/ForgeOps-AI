from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from app.database.connection import engine as _default_engine
from sqlalchemy import text


def create_demo_database(engine=None):
    engine = engine or _default_engine
    with Session(engine) as db:
        db.execute(text("DROP TABLE IF EXISTS orders"))
        db.execute(text("DROP TABLE IF EXISTS products"))
        db.execute(text("DROP TABLE IF EXISTS customers"))
        db.commit()

        db.execute(text("""
            CREATE TABLE customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                city TEXT NOT NULL,
                country TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """))

        db.execute(text("""
            CREATE TABLE products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_name TEXT NOT NULL,
                category TEXT NOT NULL,
                price REAL NOT NULL
            )
        """))

        db.execute(text("""
            CREATE TABLE orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                total_amount REAL NOT NULL,
                order_date TEXT NOT NULL,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        """))

        customers = [
            ("Alice Johnson", "alice@example.com", "New York", "USA", "2023-01-15"),
            ("Bob Smith", "bob@example.com", "London", "UK", "2023-01-20"),
            ("Carol White", "carol@example.com", "Toronto", "Canada", "2023-02-01"),
            ("David Lee", "david@example.com", "San Francisco", "USA", "2023-02-10"),
            ("Emma Brown", "emma@example.com", "Berlin", "Germany", "2023-02-15"),
            ("Frank Miller", "frank@example.com", "Paris", "France", "2023-03-01"),
            ("Grace Davis", "grace@example.com", "Sydney", "Australia", "2023-03-10"),
            ("Henry Wilson", "henry@example.com", "Tokyo", "Japan", "2023-03-15"),
            ("Ivy Martinez", "ivy@example.com", "Madrid", "Spain", "2023-04-01"),
            ("Jack Anderson", "jack@example.com", "Singapore", "Singapore", "2023-04-10"),
            ("Karen Thomas", "karen@example.com", "Dubai", "UAE", "2023-04-15"),
            ("Leo Garcia", "leo@example.com", "Mumbai", "India", "2023-05-01"),
            ("Mia Rodriguez", "mia@example.com", "Sao Paulo", "Brazil", "2023-05-10"),
            ("Nathan Clark", "nathan@example.com", "Seoul", "South Korea", "2023-05-15"),
            ("Olivia Lewis", "olivia@example.com", "Amsterdam", "Netherlands", "2023-06-01"),
            ("Paul Walker", "paul@example.com", "Stockholm", "Sweden", "2023-06-10"),
            ("Quinn Hall", "quinn@example.com", "Vienna", "Austria", "2023-06-15"),
            ("Rachel Young", "rachel@example.com", "Bangkok", "Thailand", "2023-07-01"),
            ("Sam King", "sam@example.com", "Cairo", "Egypt", "2023-07-10"),
            ("Tina Scott", "tina@example.com", "Mexico City", "Mexico", "2023-07-15"),
            ("Uma Patel", "uma@example.com", "Lagos", "Nigeria", "2023-08-01"),
            ("Victor Adams", "victor@example.com", "Rome", "Italy", "2023-08-10"),
            ("Wendy Baker", "wendy@example.com", "Lisbon", "Portugal", "2023-08-15"),
            ("Xavier Green", "xavier@example.com", "Dublin", "Ireland", "2023-09-01"),
            ("Yara Nelson", "yara@example.com", "Helsinki", "Finland", "2023-09-10"),
            ("Zack Carter", "zack@example.com", "Oslo", "Norway", "2023-09-15"),
        ]

        for name, email, city, country, created_at in customers:
            db.execute(
                text("INSERT INTO customers (name, email, city, country, created_at) VALUES (:name, :email, :city, :country, :created_at)"),
                {"name": name, "email": email, "city": city, "country": country, "created_at": created_at}
            )

        products = [
            ("Wireless Headphones", "Electronics", 79.99),
            ("Smart Watch", "Electronics", 199.99),
            ("Laptop Stand", "Electronics", 49.99),
            ("USB-C Hub", "Electronics", 39.99),
            ("Mechanical Keyboard", "Electronics", 129.99),
            ("Cotton T-Shirt", "Clothing", 24.99),
            ("Denim Jeans", "Clothing", 59.99),
            ("Winter Jacket", "Clothing", 149.99),
            ("Running Shoes", "Clothing", 99.99),
            ("Wool Sweater", "Clothing", 69.99),
            ("Coffee Maker", "Home & Kitchen", 89.99),
            ("Blender", "Home & Kitchen", 69.99),
            ("Cookware Set", "Home & Kitchen", 199.99),
            ("Bedding Set", "Home & Kitchen", 79.99),
            ("Table Lamp", "Home & Kitchen", 39.99),
            ("Yoga Mat", "Sports", 29.99),
            ("Dumbbells Set", "Sports", 89.99),
            ("Tennis Racket", "Sports", 59.99),
            ("Cycling Helmet", "Sports", 49.99),
            ("Fiction Novel", "Books", 14.99),
            ("Science Textbook", "Books", 49.99),
            ("Cookbook", "Books", 24.99),
            ("Travel Guide", "Books", 19.99),
            ("Programming Guide", "Books", 39.99),
        ]

        for product_name, category, price in products:
            db.execute(
                text("INSERT INTO products (product_name, category, price) VALUES (:product_name, :category, :price)"),
                {"product_name": product_name, "category": category, "price": price}
            )

        order_statuses = ["completed", "completed", "completed", "completed", "completed", "completed", "completed", "shipped", "pending"]
        start_date = datetime(2023, 1, 1)
        end_date = datetime(2024, 12, 31)

        for _ in range(150):
            customer_id = random.randint(1, 26)
            product_id = random.randint(1, 24)
            quantity = random.randint(1, 5)

            product_price = db.execute(text("SELECT price FROM products WHERE id = :id"), {"id": product_id}).scalar()
            total_amount = round(product_price * quantity, 2)

            days_diff = (end_date - start_date).days
            random_days = random.randint(0, days_diff)
            order_date = (start_date + timedelta(days=random_days)).strftime("%Y-%m-%d")

            db.execute(
                text("INSERT INTO orders (customer_id, product_id, quantity, total_amount, order_date) VALUES (:customer_id, :product_id, :quantity, :total_amount, :order_date)"),
                {
                    "customer_id": customer_id,
                    "product_id": product_id,
                    "quantity": quantity,
                    "total_amount": total_amount,
                    "order_date": order_date,
                }
            )

        db.commit()


if __name__ == "__main__":
    create_demo_database()
    print("Demo database created successfully!")
