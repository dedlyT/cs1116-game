from flask_wtf import FlaskForm
from wtforms import SubmitField, StringField, PasswordField
from wtforms.validators import InputRequired, ValidationError, EqualTo, Length
import re

USERNAME_PATTERN = re.compile("^[a-zA-Z]+[a-zA-Z_]*$")

class SignUpForm(FlaskForm):
    def validator(self, field):
        data = field.data
        
        if len(data) < 3 or len(data) > 15:
            raise ValidationError("Must be between 3 and 15 characters!")

        if not re.match(USERNAME_PATTERN, data):
            raise ValidationError("Invalid username! Legal characters: (a-z, 0-9, _)")
        
    username = StringField(
        render_kw={"placeholder":"Username"}, 
        validators=[InputRequired(), validator])
    password = PasswordField(
        render_kw={"placeholder":"Password"},
        validators=[InputRequired(), Length(5,20)])
    password_confirm = PasswordField(
        render_kw={"placeholder":"Confirm password"},
        validators=[InputRequired(), EqualTo("password")])
    submit = SubmitField("Sign up")

class LogInForm(FlaskForm):
    username = StringField(
        render_kw={"placeholder":"Username"},
        validators=[InputRequired(), Length(3,15)])
    password = PasswordField(
        render_kw={"placeholder":"Password"},
        validators=[InputRequired()])
    submit = SubmitField("Log in")
    
class LogOutForm(FlaskForm):
    submit = SubmitField("Log out")