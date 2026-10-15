# Martian Map

## 🚀 Installation & Setup

**1. Clone the repository**
```bash
git clone https://github.com/Raheem54/martian_map.git
cd martian_map
```
**2. Create and activate a virtual environment**

- Windows:

```Bash
python -m venv env
env\Scripts\activate
```
- macOS / Linux:

```Bash
python3 -m venv env
source env/bin/activate
```
**3. Install dependencies**

```Bash
pip install -r requirements.txt
```

## Local Database Setup (Development)
Before running the server, you need to set up the local SQLite database and create an admin user.

**1. Apply migrations**

```Bash
python manage.py migrate
```

**2. Create a superuser**

```Bash
python manage.py createsuperuser
```

**3. Run the server**

```Bash
python manage.py runserver
```

Now, open your browser and navigate to http://localhost:8000/admin to log in with your superuser credentials.