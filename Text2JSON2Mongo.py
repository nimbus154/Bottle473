import json
import bottle
from bottle import route, run, request, abort
from pymongo import Connection
from bson import BSON
from bson import json_util

connection = Connection('localhost', 27017)
db = connection.mydatabase

classfile = open("CourseList.md")

for line in classfile :
   courses = {}
   
   classes = line.split(" ",2)
   courses['department'] = classes[0]
   courses['number'] =  classes[1]
   courses['name'] = classes[2].replace("\n","")
   db['Course'].save(courses)

classfile.close()

deptfile = open("DepartmentList.md")

for line in deptfile :
   Departments = {}
   
   dept = line.split("  ",2)
   Departments['name'] = dept[1].replace("\n","")
   Departments['abbrev'] =  dept[0]
   db['Department'].save(Departments)

deptfile.close()
