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
    year: null,
    semesters: []
});

App.SemesterSchedule = Ember.Object.extend({
    // corresponds to the REST API's definition of a schedule
    // Aggregates classes
    // Should always be side of a schedule
    id: null,
    year: null,
    semester: null,
    courses: [],
    url: '/api/users/' + 'admin' + '/schedules',
    createRecord: function() {
        // create an empty schedule on the server
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
                    + " " + _this.get('semester'));
            },
            error: function() {
                console.log("Saved " + _this.get('year') 
                    + " " + _this.get('semester'));
            }
        });
    }.observes('id'), // auto save once ID is set
    serialize: function() {
        var schedule = {};
        schedule.semester = this.get('semester');
        schedule.year = this.get('year');
        schedule.user_id = this.get('user_id');
        schedule.courses = this.get('courses');

        return JSON.stringify(schedule);
    }
});

App.SemestersEnum = [
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
App.CourseCatalogFetcher = Ember.Object.createWithMixins(App.ObjectRetriever, {
    url: '/api/departments',
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
    Schedules: function(callback) {
        // returns a hash of schedules by year
        // Each year is hashed by semester/term
        var schedules = [];
        var _this = this;
        this.getObjects(this.url, function(rawSchedules) {
            // TODO handle ajax schedule load fail
            if(rawSchedules.length > 0) {
                var deserializedList = _this.deserializeList(rawSchedules);
                // asynchronously inflate the "schedules" array
                deserializedList.forEach(function(item) {
                    schedules.addObject(item);
                });
            }
            callback();
        });
        return schedules;
    },
    deserializeList: function(schedules) {
        // Transform a list of server schedule objects into a hash
        var yearSchedules = [];
        var years = schedules.map(function(item) {
            return item.year;
        }).uniq();
        // create year hashes in the schedules object
        years.forEach(function(item) {
            var yearSchedule = App.YearSchedule.create({ year: item });
            yearSchedule.set('semesters', schedules.filterProperty('year', item));
            yearSchedules.addObject(yearSchedule);
        });
        return yearSchedules;
    },
    createYear: function(year) {
        // create a new schedule year
        var context = this;
        
        // TODO bug with number of terms in year, after repeated creates
        var yearSchedule = App.YearSchedule.create();
        yearSchedule.set('year', year);

        // create fall, winter, spring, summer terms
        App.SemestersEnum.forEach(function(term) {
            var semesterSchedule = App.SemesterSchedule.create({
                year: year,
                semester: term
            });
            semesterSchedule.createRecord(); // create server record
            yearSchedule.get('semesters').addObject(semesterSchedule);
        });

        return yearSchedule;
    }
});

// get a list of all user schedules
App.schedules = App.ScheduleStore.Schedules(function() {
    // This call kicks off the application once data is fetched
    App.advanceReadiness();
});

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

App.SemesterView = Ember.View.extend({
    templateName: 'semester',
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

/////////////////////////
// ROUTES, CONTROLLERS //
/////////////////////////

// TODO handle year not found
App.Router.map(function() {
    this.resource('schedule', {path: '/schedule/:year'});
});

App.IndexRoute = Ember.Route.extend({
    renderTemplate: function() {
        var startingSchedule, thisYear = new Date().getFullYear();
        if(App.schedules.length === 0) {
            // create a year if user has no schedules
            console.log("NO schedules found");
            startingSchedule = App.ScheduleStore.createYear(thisYear);
            App.schedules.addObject(startingSchedule);
        }
        else {
            // Retrieve existing schedule, preferably for this year
            console.log("Schedules found");
            // TODO handle if this year doesn't exist
            startingSchedule = App.schedules.findProperty('year', thisYear);
        }
        this.transitionTo('schedule', startingSchedule);
    }
});

App.ScheduleRoute = Ember.Route.extend({
    setupController: function(controller, model) {
        controller.set('content', model);
    },
    model: function(params) {
        var model, yearParam;
        yearParam = parseInt(params.year); // TODO check for NaN
        model = App.schedules.findProperty('year', parseInt(params.year));
        console.log("Model chosen");
        console.log(model);
        return model;
    },
    serialize: function(model) {
        return { 'year': model.year };
    }
});

App.CourseCatalogController = Ember.ArrayController.extend({
    classes: App.CourseCatalogFetcher.courses('cpsc')
});

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
