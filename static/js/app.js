var App = Ember.Application.create({
    LOG_TRANSITIONS: true // show routes for debugging
});

// wait until we get all schedules; advanceReadiness called in ScheduleStore.all
App.deferReadiness(); 


//////////////////////////
// MODELS AND DATASTORE //
//////////////////////////

// mixin to extract common ajax retrieval
App.ObjectRetriever = Ember.Mixin.create({
    getObjects: function(url, successCallback) {
        var array = [];
        $.getJSON(url, function(data) {
            // Ember's observer pattern magic lets this populate everywhere!
            array.addObjects(data);
            if(successCallback) {
                successCallback(array);
            }
        });
        return array;
    },
    all: null, // retrieve all objects
    find: null // retrieve an object
});

App.YearSchedule = Ember.Object.extend({
    // essentially, an organized collection of terms
    year: null,
    terms: [],
    save: function() {
        // client schedule and server schedule are different objects
        // server schedule ~= client-side term
        var year, termSchedule = {}, context = this;
        year = this.get('year');

        this.get('terms').forEach(function(term) {
           term.save();
        });
    }
});

App.TermSchedule = Ember.Object.extend({
    // corresponds to the REST API's definition of a schedule
    // Aggregates classes
    // Should always be side of a schedule
    id: null,
    year: null,
    term: null,
    courses: [],
    url: '/api/users/' + 'admin' + '/schedules',
    createRecord: function() {
        // create an empty term on the server
        var _this = this;
        if(this.get('id')) {
            throw new Error("Object already exists on server!");
        }
        console.log("Create record called");
        $.ajax({
            url: this.url,
            type: 'post',
            // JQuery 1.9 treats empty response bodies as errors
            // 201 create has an empty response body :-/
            async: false,
            error: function(xhr, status, error) {
                if(xhr.status === 201) {
                    // success, set ID
                    _this.set('id', xhr.getResponseHeader('Location'));
                }
                else {
                    // TODO replace with real error handling
                    console.log(error);
                }
            }
        });
    },
    save: function() {
        var _this = this;
        console.log('saving...');
        console.log(this);
        $.ajax({
            url: this.get('id'),
            type: 'put',
            contentType: 'application/json',
            processData: false,
            data: this.serialize(),
            success: function() { 
                console.log("Saved " + _this.get('year') 
                    + " " + _this.get('term'));
            },
            error: function() {
                console.log("Saved " + _this.get('year') 
                    + " " + _this.get('term'));
            }
        });
    }.observes('id'), // auto save once ID is set
    serialize: function() {
        var termSchedule = {};
        termSchedule.semester = this.get('term');
        termSchedule.year = this.get('year');
        termSchedule.user_id = this.get('user_id');
        termSchedule.courses = this.get('courses');

        return JSON.stringify(termSchedule);
    }
});

App.Terms = [
    'FALL',
    'WINTER',
    'SPRING',
    'SUMMER'
];

App.Course = Ember.Object.extend({
    // course associated with a term
    name: null,
    number: null,
    dept: null,
    prereqs: []
});

// pattern borrowed from
// http://stackoverflow.com/questions/12064765/initialization-with-serialize-deserialize-ember-js
App.DepartmentFetcher = Ember.Object.createWithMixins(App.ObjectRetriever, {
    url: '/departments',
    all: function() {
        return this.getObjects(this.url);
    },
    courses: function(deptAbbrev) {
        var url = this.url + '/' + deptAbbrev.toUpperCase();
        return this.getObjects(url);
    }
});

App.ScheduleStore = Ember.Object.createWithMixins(App.ObjectRetriever, {
    user: null,
    url: '/api/users/' + 'admin' + '/schedules',
    all: function() {
        // retrieve all objects, then instantiate them as Ember objects
        return this.getObjects(this.url, function(array) {
            console.log(array);
            // start app
            // TODO handle ajax schedule load fail
            App.advanceReadiness();
        });
    },
    createYear: function(year) {
        // create a new schedule year
        var context = this;
        
        // TODO bug with number of terms in year, after repeated creates
        var yearSchedule = App.YearSchedule.create();
        yearSchedule.set('year', year);

        // create fall, winter, spring, summer terms
        App.Terms.forEach(function(term) {
            console.log(term);
            console.log(year);

            var termSchedule = App.TermSchedule.create();
            termSchedule.set('year', year);
            termSchedule.set('term', term);
            termSchedule.createRecord(); // create server record
            yearSchedule.get('terms').addObject(termSchedule);

            console.log(yearSchedule.get('terms').length);
        });

        return yearSchedule;
    }
});

// get a list of all user schedules
App.schedules = App.ScheduleStore.all();

/////////////////////////
//        VIEWS        //
/////////////////////////

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

// TODO handle year not found
App.Router.map(function() {
    this.resource('schedule', {path: '/schedule/:year'});
});

App.IndexRoute = Ember.Route.extend({
    renderTemplate: function() {
        var startingSchedule, thisYear = new Date().getFullYear();

        if(App.schedules.length == 0) {
            console.log("Schedules not found");
            startingSchedule = App.ScheduleStore.createYear(thisYear);
            App.schedules.addObject(startingSchedule);
            console.log(App.schedules);
            console.log(startingSchedule);
        }
        else {
            // if this year, get schedule for this year
            console.log("Schedules found");
            startingSchedule = App.schedules.find(function(item) {
                return item.year == thisYear;
            });
        }
        this.transitionTo('schedule', startingSchedule);
    }
});

App.ScheduleRoute = Ember.Route.extend({
    setupController: function(controller, model) {
        controller.set('content', model);
    },
    model: function(params) {
        console.log("Items");
        //App.schedules.findProperty('year', params.year); might work too
        var model = App.schedules.find(function(item) {
            console.log("Item year: " + item.year);
            console.log("Params year: " + params.year);
            return item.year == params.year;
        });
        console.log(model);
        return model;
    },
    serialize: function(model) {
        return { 'year': model.year };
    }
});

App.CourseCatalogController = Ember.ArrayController.extend({
    classes: App.DepartmentFetcher.courses('cpsc')
});

App.ScheduleController = Ember.ObjectController.extend();

App.TermController = Ember.ObjectController.extend({
    add: function(course) {
        console.log('Adding ');
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
