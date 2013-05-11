var App = Ember.Application.create({
    LOG_TRANSITIONS: true
});

var user = "admin";

App.Store = DS.Store.extend({
    revision: 12,
    adapter: DS.RESTAdapter
});

// Modify the RESTAdapter to fit our POST/PUT format
// These are slight modifications to the methods in the Ember library.
// By default, Ember would post {"schedule":{}}, but we want just the object.
// https://github.com/emberjs/data/blob/master/packages/ember-data/lib/adapters/rest_adapter.js#L121
DS.RESTAdapter.reopen({
    url: '/api/users/' + user,
    createRecord: function(store, type, record) {
        var root = this.rootForType(type);
        var adapter = this;

        return this.ajax(this.buildURL(root), "POST", {
            data: this.serialize(record, { includeId: true })
        }).then(function(json){
            Ember.run(adapter, 'didCreateRecord', store, type, record, json);
        }, function(xhr) {
            adapter.didError(store, type, record, xhr);
            throw xhr;
        });
    },
    updateRecord: function(store, type, record) {
        var id, root, adapter;

        id = get(record, 'id');
        root = this.rootForType(type);
        adapter = this;

        return this.ajax(this.buildURL(root, id), "PUT",{
            data: this.serialize(record)
        }).then(function(json){
            Ember.run(adapter, 'didUpdateRecord', store, type, record, json);
        }, function(xhr) {
            adapter.didError(store, type, record, xhr);
            throw xhr;
        });
    }
});

// Define how to serialize arrays
DS.RESTAdapter.registerTransform('array', {
    serialize: function(value) {
        return JSON.stringify(value);
    },
    deserialize: function(value) {
        return JSON.parse(value);
    }
});

App.Department = DS.Model.extend({
    name: DS.attr('string'),
    abbrev: DS.attr('string')
});

App.Class = DS.Model.extend({
    name: DS.attr('string'),
    number: DS.attr('number'),
    dept: DS.attr('string'),
    prereqs: DS.attr('array')
});

App.Schedule = DS.Model.extend({
    semester: DS.attr('string'),
    year: DS.attr('string'),
    user_id: DS.attr('string'),
    courses: DS.attr('array')
});

/*
App.Schedule = Ember.Object.extend({
    year: null,
    terms: [ ]
});
*/


App.Term = Ember.Object.extend({
    term: null,
    classes: []
});

App.Class = Ember.Object.extend({
    name: null,
    number: 0,
    dept: null,
    prereqs: []
});

App.schedules = [
    App.Schedule.create({
        year: 2012,
        terms: [
            App.Term.create({
                term: 'fall',
                classes: [ 
                    App.Class.create({
                        name: 'Python',
                        number: 223,
                        dept: 'cpsc',
                        prereqs: ['cpsc131']
                    }),
                    App.Class.create({
                        name: 'Web Programming',
                        number: 473,
                        dept: 'cpsc',
                        prereqs: ['cpsc433']
                    }),
                    App.Class.create({
                        name: 'Java Enterprise',
                        number: 476,
                        dept: 'cpsc',
                        prereqs: ['cpsc362']
                    })
                ]
            }),
            App.Term.create({
                term: 'spring',
                classes: [ 
                    App.Class.create({
                        name: 'Calculus II',
                        number: '150b',
                        dept: 'math',
                        prereqs: ['math150a']
                    }),
                    App.Class.create({
                        name: 'Math Structures II',
                        number: '270b',
                        dept: 'math',
                        prereqs: ['math270a']
                    })
                ]
            }),
            App.Term.create({
                term: 'summer',
                classes: [ 
                    App.Class.create({
                        name: 'Calculus I',
                        number: '150a',
                        dept: 'math',
                        prereqs: []
                    }),
                    App.Class.create({
                        name: 'Math Structures I',
                        number: '270a',
                        dept: 'math',
                        prereqs: []
                    })
                ]
            }),
            App.Term.create({
                term: 'winter',
                classes: [ 
                    App.Class.create({
                        name: 'Intro to Programming',
                        number: '121',
                        dept: 'cpsc',
                        prereqs: []
                    }),
                    App.Class.create({
                        name: 'Ethics',
                        number: '311',
                        dept: 'cpsc',
                        prereqs: []
                    })
                ]
            })
        ]
    }),
    App.Schedule.create({
        year: 2013,
        terms: [
            App.Term.create({
                term: 'fall',
                classes: [ 
                    App.Class.create({
                        name: 'Software Engineering',
                        number: 362,
                        dept: 'cpsc',
                        prereqs: ['cpsc131']
                    }),
                    App.Class.create({
                        name: 'Database Programming',
                        number: 431,
                        dept: 'cpsc',
                        prereqs: ['cpsc332']
                    }),
                    App.Class.create({
                        name: 'Programming Languages and Translation',
                        number: 323,
                        dept: 'cpsc',
                        prereqs: ['cpsc240']
                    })
                ]
            }),
            App.Term.create({
                term: 'spring',
                classes: [ 
                    App.Class.create({
                        name: 'Software Design',
                        number: 462,
                        dept: 'cpsc',
                        prereqs: ['cpsc362']
                    }),
                    App.Class.create({
                        name: 'Data Security and Encryption',
                        number: 433,
                        dept: 'cpsc',
                        prereqs: ['cpsc131']
                    }),
                    App.Class.create({
                        name: 'Distributed Systems',
                        number: 551,
                        dept: 'cpsc',
                        prereqs: ['cpsc351']
                    })
                ]
            }),
            App.Term.create({
                term: 'summer',
                classes: [
                    App.Class.create({
                        name: 'Algorithms',
                        number: 335,
                        dept: 'cpsc',
                        prereqs: ['cpsc131']
                    })
                ]
            }),
            App.Term.create({
                term: 'winter',
                classes: [ 
                    App.Class.create({
                        name: 'Intro to Programming',
                        number: '121',
                        dept: 'cpsc',
                        prereqs: []
                    }),
                    App.Class.create({
                        name: 'Ethics',
                        number: '311',
                        dept: 'cpsc',
                        prereqs: []
                    })
                ]
            })
        ]
    })
];

var classes = [
    App.Class.create({
        name: 'Data Structures',
        number: 131,
        dept: 'cpsc',
        prereqs: ['cpsc121']
    }),
    App.Class.create({
        name: 'Assembly Language',
        number: 240,
        dept: 'cpsc',
        prereqs: ['cpsc131']
    }),
    App.Class.create({
        name: 'Programming Languages and Translation',
        number: 323,
        dept: 'cpsc',
        prereqs: ['cpsc131', 'cpsc240']
    }),
    App.Class.create({
        name: 'Operating Systems Concepts',
        number: 351,
        dept: 'cpsc',
        prereqs: ['cpsc240']
    })
];

var departments = [
    {
        name: 'Computer Science',
        abbrev: 'cpsc'
    },
    {
        name: 'Math',
        abbrev: 'math'
    }
];

// thanks to http://jsfiddle.net/ud3323/5uX9H/ for drag n' drop tips
App.ClassView = Ember.View.extend({
    templateName: 'class',
    attributeBindings: 'draggable',
    draggable: 'true',
    dragStart: function(event) {
        var dataTransfer = event.dataTransfer;
        var course = this.get('context'); // the item being dragged
        dataTransfer.setData('application/json', JSON.stringify(course));
    }
});

App.TermView = Ember.View.extend({
    templateName: 'term',
    dragOver: function(event) {
        event.preventDefault();
        return false;
    },
    drop: function(event) {
        event.preventDefault();
        var rawData = event.dataTransfer.getData('application/json');
        var course = App.Class.create(JSON.parse(rawData));
        console.log(this.get('controller'));
        this.get('controller').add(course);
        return false;
    }
});

App.Router.map(function() {
    this.resource('schedule', {path: '/schedule/:year'});
});

App.IndexRoute = Ember.Route.extend({
    renderTemplate: function() {
        thisYear = new Date().getFullYear();
        console.log(App.Department.find());
        var startingSchedule = App.schedules.find(function(item) {
            return item.year == thisYear;
        });
        this.transitionTo('schedule', startingSchedule);
    }
});

App.ScheduleRoute = Ember.Route.extend({
    setupController: function(controller, model) {
        controller.set('content', model);
    },
    model: function(params) {
        return App.schedules.find(function(item) {
            return item.year == params.year;
        });
    },
    serialize: function(model) {
        return { 'year': model.year };
    }
});

App.ClassCollector = Ember.Mixin.create({
    add: function(course) {
        console.log("Adding ");
        console.log(course);
        var inList = this.classes.find(function(item) {
            return item.get('dept') === course.get('dept') && 
                    item.get('number') === course.get('number'); 
        });
        if(!inList) {
            this.classes.addObject(course);
        }
    },
    remove: function(course) {
        this.classes.removeObject(course);
    }
});

App.CourseCatalogController = Ember.ArrayController.extend(App.ClassCollector, {
    classes: classes
});

App.ScheduleController = Ember.ObjectController.extend();

App.TermController = Ember.ObjectController.extend(App.ClassCollector, {
    add: function(course) {
        console.log("Adding ");
        console.log(course);
        var inList = this.get('classes').find(function(item) {
            return item.get('dept') === course.get('dept') && 
                    item.get('number') === course.get('number'); 
        });
        if(!inList) {
            this.get('classes').addObject(course);
        }
    },
    remove: function(course) {
        this.get('classes').removeObject(course);
    }
});
