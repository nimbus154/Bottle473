var App = Ember.Application.create({
    LOG_TRANSITIONS: true // show routes for debugging
});

// wait until we get all schedules; advanceReadiness called in ScheduleStore.all
App.deferReadiness(); 

//////////////////////////
// MODELS AND DATASTORE //
//////////////////////////

App.User = null;
// synchronously retrieve user info from server
$.ajax({
    url: '/api/sessions',
    async: false,
    dataType: 'json',
    success: function(data) {
        App.User = data.username;
    },
    error: function() {
        // error retrieving credentials = not logged in
        document.location = '/';
    },
});

// mixin to extract common ajax retrieval functions
App.ObjectRetriever = Ember.Mixin.create({
    getObjects: function(url, successCallback) {
        var array = [];
        $.ajax({
            url: url,
            dataType: 'json',
            success: function(data) {
                // Ember's observer pattern magic lets this populate everywhere!
                array.addObjects(data);
                if(successCallback) {
                    successCallback(array);
                }
            }
        });
        return array;
    },
    all: null, // retrieve all objects
    find: null // retrieve an object
});

// helper object for grouping semesters by year
App.YearSchedule = Ember.Object.extend({
    year: null,
    semesters: []
});

// core business object, represents a student's schedule for a semester
App.SemesterSchedule = Ember.Object.extend({
    id: null,
    year: null,
    semester: null,
    courses: [],
    url: '/api/users/' + App.User + '/schedules',
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
                    _this.save();
                }
                else {
                    // TODO replace with real error handling
                    console.log(error);
                }
            }
        });
    },
    findCourse: function(dept, number) {
        return  this.get('courses').find(function(course) {
            return course.get('department') === dept && 
                    course.get('number') === number;
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
    },
    serialize: function() {
        var schedule = {};
        schedule.semester = this.get('semester');
        schedule.year = this.get('year');
        schedule.user_id = this.get('user_id');
        schedule.courses = this.get('courses');

        return JSON.stringify(schedule);
    }
});

// Possible semesters
App.SemestersEnum = [
    'FALL',
    'WINTER',
    'SPRING',
    'SUMMER'
];

// course associated with a semester
App.Course = Ember.Object.extend({
    name: null,
    number: null,
    department: null,
    prereqs: []
});

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

// This "return empty object, then inflate via observers" pattern is inspired by
// http://stackoverflow.com/questions/12064765/initialization-with-serialize-deserialize-ember-js
App.ScheduleStore = Ember.Object.createWithMixins(App.ObjectRetriever, {
    user: null,
    url: '/api/users/' + App.User + '/schedules',
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
        // Transform a list of server schedules into a YearSchedule
        var yearSchedules = [];
        var _this = this;
        var years = schedules.map(function(item) {
            return item.year;
        }).uniq();
        years.forEach(function(item) {
            var yearSchedule = App.YearSchedule.create({ year: item });

            var semesters = schedules.filterProperty('year', item).map(function(item) {
                return _this.deserializeSemester(item);
            }).sort(function(a, b) {
                // sort order: Fall, Winter, Spring, Summer
                var aOrder = App.SemestersEnum.indexOf(a.get('semester'));
                var bOrder = App.SemestersEnum.indexOf(b.get('semester'));
                return aOrder - bOrder;
            });

            yearSchedule.set('semesters', semesters);
            yearSchedules.addObject(yearSchedule);
        });
        return yearSchedules;
    },
    deserializeSemester: function(rawSemester) {
        var semester = App.SemesterSchedule.create({
            semester: rawSemester.semester,
            year: rawSemester.year
        });
        semester.set('id', this.url + '/' + rawSemester.id);
        var courses = rawSemester.courses.map(function(course) {
            return App.Course.create(course);
        });
        semester.set('courses', courses);
        return semester;
    },
    createYear: function(year, callback) {
        // create a new schedule year
        var context = this;
        
        // TODO bug with number of terms in year, after repeated creates
        var yearSchedule = App.YearSchedule.create();
        yearSchedule.set('year', year);

        // create fall, winter, spring, summer terms
        App.SemestersEnum.forEach(function(term) {
            var semesterSchedule = App.SemesterSchedule.create({
                year: year,
                semester: term,
                courses: []
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

App.Draggable = Ember.Mixin.create({
    attributeBindings: 'draggable',
    draggable: 'true',
    dragStart: function(event) {
        var dataTransfer = event.dataTransfer;
        var course = this.get('context'); // the item being dragged
        dataTransfer.setData('application/json', JSON.stringify(course));
    }
});

// thanks to http://jsfiddle.net/ud3323/5uX9H/ for drag n' drop tips
App.CourseView = Ember.View.extend(App.Draggable, {
    templateName: 'course', 
    dragStart: function(event) {
        var dataTransfer = event.dataTransfer;
        var course = this.get('context'); // the item being dragged

        // this hack is note which list the item came from
        var sourceList = $('#' + event.target.id).parent().attr('id');
        // set as hash so it doesn't affect the ember object
        course['source'] = sourceList; 

        dataTransfer.setData('application/json', JSON.stringify(course));
    }
});


// defined inline; 
App.DeleteCourseView = Ember.View.extend({
    tagName: 'button',
    click: function(event) {
        var course = this.get('context');
        this.get('controller').remove(course);
    }
});

// defined inline
App.CatalogCourseView = Ember.View.extend(App.Draggable);

App.SemesterView = Ember.View.extend({
    templateName: 'semester',
    dragOver: function(event) {
        event.preventDefault();
        return false;
    },
    drop: function(event) {
        event.preventDefault();
        var rawData = JSON.parse(event.dataTransfer.getData('application/json'));
        var sourceSemester = rawData.source;
        var targetSemester = this.get('context');
        delete rawData.source;
        var course = App.Course.create(rawData);
        this.get('controller').add(course, targetSemester, sourceSemester);
        return false;
    }
});

// Handle logout
// Defined inline
App.LogoutView = Ember.View.extend({
    click: function() {
        $.ajax({
            url: '/api/sessions/' + App.User,
            type: 'delete',
            success: function() {
                // redirect to login page
                document.location = '/';
            },
            error: function() {
                // redirect to login page
                document.location = '/';
            }
        });
    }
});

App.Lightbox = Ember.Mixin.create({
    click: function() {
        var view = Ember.View.create({
            context: this.get('context'),
            templateName: 'courseInfo'
        });
        console.log("Context", this.get('context'));
        var modal = $('#modal');
        modal.empty(); // clear old data
        view.appendTo(modal); // add new view
        modal.modal(); // render modal dialog
    }
});

App.CourseInfoView = Ember.View.extend(App.Lightbox);
App.CatalogCourseInfoView = Ember.View.extend(App.Lightbox);

/////////////////////////
// ROUTES, CONTROLLERS //
/////////////////////////

// TODO handle year not found
App.Router.map(function() {
    this.resource('schedule', {path: '/schedule/:year'});
});

// /
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
            startingSchedule = App.schedules.findProperty('year', thisYear);

            if(!startingSchedule) {
                startingScehdule = App.schedules[0];
            }
        }
        this.transitionTo('schedule', startingSchedule);
    }
});

// /schedule/<year>
App.ScheduleRoute = Ember.Route.extend({
    setupController: function(controller, model) {
        controller.set('content', model);
    },
    model: function(params) {
        var model, yearParam;
        yearParam = parseInt(params.year); // TODO check for NaN
        model = App.schedules.findProperty('year', yearParam);
        if(!model) {
            this.transitionTo('/');
        }
        return model;
    },
    serialize: function(model) {
        return { 'year': model.year };
    }
});

// Holds data for the list of courses on the left side of the screen
App.CourseCatalogController = Ember.ArrayController.extend({
    classes: App.CourseCatalogFetcher.courses('cpsc')
});

App.ScheduleController = Ember.ObjectController.extend({
    add: function(course, target, source) {
        var inList = target.findCourse(course.get('department'), course.get('number'));
        if(!inList) {
            // if item was dragged from another semester, remove it
            if(source) {
                var sourceTerm = this.get('content.semesters').findProperty('semester', source);
                // find course
                var oldCourse = sourceTerm.findCourse(course.get('department'), course.get('number'));
                sourceTerm.get('courses').removeObject(oldCourse);
                sourceTerm.save();
            }
            
            // add to target
            target.get('courses').addObject(course);
            target.save();
        }
    },
    remove: function(course) {
        console.log('Removing', course);
        var semesters = this.get('content.semesters');
        semesters.forEach(function(semester) {
            // this looks insanely dangerous but it isn't
            // objects have unique identifiers, and so "course"
            // will only be removed from the term that has that exact instance
            var courses = semester.get('courses');
            var startingLength = courses.length;
            courses.removeObject(course);
            // save semester if item was removed
            if(courses.length < startingLength) {
                console.log("item removed from " + semester.get('semester'));
                semester.save();
            }
        });
    },
    addYear: function() {
        // get the largest year, add next one
        App.schedules.sort(function(a, b) {
            var aYear = a.get('year');
            var bYear = b.get('year');
            return aYear - bYear;
        });

        var newYear = App.schedules[App.schedules.length - 1].get('year') + 1;
        var newSchedule = App.ScheduleStore.createYear(newYear);
        App.schedules.addObject(newSchedule);
        this.transitionToRoute('schedule', newSchedule);
    }
});
