from datetime import datetime, timedelta
import random
from sqlalchemy import text
from sqlalchemy.orm import Session


def create_demo_schema(user_id: int):
    from app.database.connection import _user_engine
    user_engine = _user_engine(user_id)
    with Session(user_engine) as db:
        db.execute(text("DROP TABLE IF EXISTS orders CASCADE"))
        db.execute(text("DROP TABLE IF EXISTS products CASCADE"))
        db.execute(text("DROP TABLE IF EXISTS customers CASCADE"))
        db.commit()

        db.execute(text("""
            CREATE TABLE customers (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                city TEXT NOT NULL,
                country TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """))
        db.execute(text("""
            CREATE TABLE products (
                id SERIAL PRIMARY KEY,
                product_name TEXT NOT NULL,
                category TEXT NOT NULL,
                price DOUBLE PRECISION NOT NULL
            )
        """))

        db.execute(text("""
            CREATE TABLE orders (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES customers(id),
                product_id INTEGER NOT NULL REFERENCES products(id),
                quantity INTEGER NOT NULL,
                total_amount DOUBLE PRECISION NOT NULL,
                order_date TEXT NOT NULL
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

        db.execute(
            text("INSERT INTO customers (name, email, city, country, created_at) VALUES "
                 + ", ".join(["(:n%d, :e%d, :ci%d, :co%d, :cr%d)" % (i, i, i, i, i) for i in range(len(customers))])),
            {k: v for i, (name, email, city, country, created_at) in enumerate(customers)
             for k, v in {
                 f"n{i}": name, f"e{i}": email, f"ci{i}": city, f"co{i}": country, f"cr{i}": created_at
             }.items()}
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

        db.execute(
            text("INSERT INTO products (product_name, category, price) VALUES "
                 + ", ".join(["(:pn%d, :ca%d, :pr%d)" % (i, i, i) for i in range(len(products))])),
            {k: v for i, (product_name, category, price) in enumerate(products)
             for k, v in {f"pn{i}": product_name, f"ca{i}": category, f"pr{i}": price}.items()}
        )

        start_date = datetime(2023, 1, 1)
        end_date = datetime(2024, 12, 31)

        product_prices = {
            pid: (db.execute(text("SELECT price FROM products WHERE id = :id"), {"id": pid}).scalar())
            for pid in range(1, 25)
        }
        order_params = []
        for _ in range(150):
            customer_id = random.randint(1, 26)
            product_id = random.randint(1, 24)
            quantity = random.randint(1, 5)
            total_amount = round(product_prices[product_id] * quantity, 2)
            days_diff = (end_date - start_date).days
            random_days = random.randint(0, days_diff)
            order_date = (start_date + timedelta(days=random_days)).strftime("%Y-%m-%d")
            order_params.append({
                "customer_id": customer_id,
                "product_id": product_id,
                "quantity": quantity,
                "total_amount": total_amount,
                "order_date": order_date,
            })

        db.execute(
            text("INSERT INTO orders (customer_id, product_id, quantity, total_amount, order_date) VALUES "
                 + ", ".join(["(:cu%d, :pr%d, :q%d, :ta%d, :od%d)" % (i, i, i, i, i) for i in range(len(order_params))])),
            {k: v for i, op in enumerate(order_params)
             for k, v in {
                 f"cu{i}": op["customer_id"], f"pr{i}": op["product_id"], f"q{i}": op["quantity"],
                 f"ta{i}": op["total_amount"], f"od{i}": op["order_date"],
             }.items()}
        )

        db.commit()
