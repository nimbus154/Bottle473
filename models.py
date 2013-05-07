import datetime 
from mongoengine import Document, connect
from mongoengine import StringField, ListField, IntField, ReferenceField

DB_NAME = 'mydatabase'

class Users(Document):
    username = StringField(required=True)
    password = StringField(required=True)

class Course(Document):
    name = StringField(required=True)
    number = IntField(required=True)
    dept = StringField(required=True)
    prereqs = ListField(StringField())

class Schedule(Document):
    semester = StringField()
    year = StringField()
    user_id = StringField(required=True)
    courses = ListField(ReferenceField(Course))

class Department(Document):
    name = StringField(required=True)
    abbrev = StringField(required=True)

connect(DB_NAME)
