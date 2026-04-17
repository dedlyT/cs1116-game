from flask import Flask, render_template, redirect, url_for, session, g, request, abort
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
from database import database
import sqlite3 as sql
import functools
import forms
import json
import os

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret-key"
app.teardown_appcontext(database.close_db)

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

@app.before_request
def load_session():
    g.username = session.get("username", None)

@app.context_processor
def inject_jinja():
    return { "logout": forms.LogOutForm() }

def login_required(v):
    @functools.wraps(v)
    def wrapped_v(*args, **kwargs):
        if g.username is None:
            return redirect(url_for("login", next=request.url))
        return v(*args, **kwargs)
    return wrapped_v

def logout_required(v):
    @functools.wraps(v)
    def wrapped_v(*args, **kwargs):
        if g.username is not None:
            return redirect(url_for("home"))
        return v(*args, **kwargs)
    return wrapped_v

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/login/", methods=["GET", "POST"])
@logout_required
def login():
    login_form = forms.LogInForm()

    if login_form.validate_on_submit():
        db = database.get_db()

        username = login_form.username.data
        password = login_form.password.data

        stored_hash = db.execute("""
            SELECT password
            FROM accounts
            WHERE username = ?;
        """, (username,)).fetchone()["password"]

        if stored_hash and check_password_hash(stored_hash, password):
            session["username"] = username
            next = request.args.get("next")
            if next is None:
                next = url_for("home")
            return redirect(next)
        
        login_form.username.errors += ["Invalid username or password!"]

    return render_template("login.html", f=login_form)

@app.route("/signup/", methods=["GET", "POST"])
@logout_required
def signup():
    signup_form = forms.SignUpForm()

    if signup_form.validate_on_submit():
        db = database.get_db()

        username = signup_form.username.data
        in_hash = generate_password_hash(signup_form.password.data)

        try:
            db.execute("""
                INSERT INTO accounts(username, password)
                VALUES (?, ?)
            """, (username, in_hash))
            db.commit()
        except sql.IntegrityError:
            signup_form.username.errors += ["Username already in use!"]
        else:
            session["username"] = username
            next = request.args.get("next")
            if next is None:
                next = url_for("home")
            return redirect(next)

    return render_template("signup.html", f=signup_form)

@app.route("/level/")
@app.route("/level/<level_name>")
def get_level(level_name=None):
    if level_name is None:
        return os.listdir(os.path.join(app.root_path, "static/levels"))
    
    try:
        with open(f"static/levels/{level_name}", "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        return abort(404)
    
    return {
        "background": data["background"],
        "middleground": data["middleground"],
        "foreground": data["foreground"],
        "spawn": data["spawn"],
        "enemy_spawns": data["enemy_spawns"]
    }

@app.route("/logout/", methods=["POST"])
@login_required
def logout():
    del session["username"]
    next = request.args.get("next")
    if next is None:
        next = url_for("home")
    return redirect(next)

@app.route("/game/")
@login_required
def game():
    return render_template("game.html")

@app.route("/editor/")
@login_required
def editor():
    if g.username != "admin":
        return redirect(url_for("home"))
    return render_template("editor.html")