var App = Ember.Application.create({
    LOG_TRANSITIONS: true // show routes for debugging
});

// wait until we get all schedules; advanceReadiness called in ScheduleStore.all
App.deferReadiness(); 

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
           termSchedule.semester = term.get('term');
           termSchedule.year = year;
           termSchedule.user_id = 'admin\'s id';
           termSchedule.courses = term.get('courses');

           context.__saveOne(termSchedule, term.get('id'));
        });
    },
    __saveOne: function(schedule) {
        // save a serverSchedule
        // not meant to be called externally
        console.log('saving...');
        console.log(schedule);
        $.ajax({
            url: shedule.get('id'),
            type: 'put',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(schedule)
        });
    }
});

App.TermSchedule = Ember.Object.extend({
    // corresponds to the REST API's definition of a schedule
    // Aggregates classes
    // Should always be side of a schedule
    term: null,
    courses: [],
});

App.TermSchedule.reopen({
    createRecord: function(options) {
        // creates an empty term on the server
        // instantiates an object, then set ID once it's created via the store

        var term = this.create(options);
        this.store.create(term);
        return term;
    }
});

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
    create: function(options) {
        var term = App.TermSchedule.create(options);

        $.ajax({
            url: this.url,
            type: 'post',
        // JQuery 1.9 treats empty response bodies as errors
        // 201 create has an empty response body :-/
            error: function(xhr, status, error) {
                if(xhr.status === 201) {
                    // success
                    term.set('id', xhr.getResponseHeader('Location'));
                }
                else {
                    // TODO replace with real error handling
                    console.log(error);
                }
            }
        });
        
        return term;
    }
});

// get a list of all user schedules
App.schedules = App.ScheduleStore.all();

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
        var thisYear = new Date().getFullYear();
        if(App.schedules.length == 0) {
            console.log("No schedules");
        }
        else {
            console.log("Shedules found");
        }
        thisYear = new Date().getFullYear();
        /*
        var startingSchedule = App.schedules.find(function(item) {
            return item.year == thisYear;
        });
        */
        // this.transitionTo('schedule', startingSchedule);
    }
});

App.ScheduleRoute = Ember.Route.extend({
    setupController: function(controller, model) {
        controller.set('content', model);
    },
    model: function(params) {
        // return App.Schedule.find(params.year);
        return {};
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
