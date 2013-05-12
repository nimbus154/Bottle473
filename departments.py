import json
import bottle
from bottle import route, run, request, abort
from pymongo import Connection
from bson import BSON
from bson import json_util
 
connection = Connection('localhost', 27017)  #need to modify for your database
db = connection.mydatabase

     
@route('/api/departments', method='GET')
def get_departments():
    departmentslist = []
    entity = db['Department'].find()
    if not entity:
        abort(404, 'No departments available')
    for dp in entity:
        departmentslist.append(dp)
    return json.dumps(departmentslist, sort_keys=True, indent=4, default=json_util.default)


@route('/api/departments/:abbrev', method='GET')
def get_departments_info(abbrev):
    classlist = []
    entity = db['Course'].find({'department': abbrev})
    if not entity:
        abort(404, 'No classes available')
    for cl in entity:
       classlist.append(cl)
    return json.dumps(classlist, sort_keys=True, indent=4, default=json_util.default)
