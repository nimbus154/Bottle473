import datetime
from mongoengine import Document, connect
from mongoengine import StringField 

DB_NAME = '473'

class Users(Document):
    username = StringField(required=True)
    password = StringField(required=True)

connect(DB_NAME)
