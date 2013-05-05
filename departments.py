import json
import bottle
from bottle import route, run, request, abort
from pymongo import Connection
from bson import BSON
from bson import json_util
 
connection = Connection('localhost', 27017) #change this to our database, it is local database right now
db = connection.mydatabase
 
@route('/departments', method='PUT')    #This is to we can uploaded txt file to database, still need to fix this.
def put_departments():
    data = request.body.readline()
    if not data:
        abort(400, 'No data received')
    entity = json.loads(data)
    try:
        db['departments'].save(entity)
    except ValidationError as ve:
        abort(400, str(ve))
     
@route('/departments', method='GET')   #Get list of all departments
def get_departments():
    departmentslist = []
    entity = db['departments'].find()
    if not entity:
        abort(404, 'No departments available')
    for dp in entity:
        departmentslist.append(dp)
    return json.dumps(departmentslist, sort_keys=True, indent=4, default=json_util.default)


@route('/departments/:abbrev', method='GET')  #Get department information based on department abbreviation
def get_departments_info(abbrev):
    entity = db['departments'].find_one({'abbrev': abbrev})
    if not entity:
        abort(404, 'No department information available')
    return json.dumps(entity, sort_keys=True, indent=4, default=json_util.default)
    
run(host='localhost', port=8080)
