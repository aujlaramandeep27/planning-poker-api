const _ = require('lodash');
const {spy,stub, assert, match} = require('sinon');

const Story = require('./storyModel');
const Meeting = require('../Meeting/meetingModel');
const fixture = require('./storyController');

describe('Story Controller', () => {
    let req = {},
        error = new Error({ error: "blah blah" }),
        res = {}, status, send, json;

    const storyId = '123';

    beforeEach(() => {
        json = spy();
        send = spy();
        status = stub();

        res = { json, status, send};

        status.returns(res);
    });

    describe('list all stories', () => {
        let expectedResult, mockStoryFind;

        beforeEach(() => {
            mockStoryFind = stub(Story, 'find');
        });

        afterEach(() => {
            mockStoryFind.restore();
        });

        it('should return an array of stories', async () => {
            expectedResult = [];

            mockStoryFind.returns(expectedResult);

            await fixture.list_stories(req, res);

            assert.calledWith(Story.find);
            json.calledWith(match(expectedResult));            
        });
        
        it('should return error if there is a server error', async () => {
            mockStoryFind.throws(error);
            
            await fixture.list_stories(req, res);
            
            assert.calledWith(Story.find);
            status.calledWith(500);
            send.calledWith(match(error));
        });
    });

    describe('get story by id', () => {
        let expectedResult, mockStoryFindById;

        beforeEach(() => {
            mockStoryFindById = stub(Story, 'findById');
        });

        afterEach(() => {
            mockStoryFindById.restore();
        });

        it('should return a story', async () => {
            expectedResult = {_id: storyId};

            mockStoryFindById.returns(expectedResult);

            _.set(req, 'params.storyId', storyId);

            await fixture.get_story(req, res);

            assert.calledWith(Story.findById, storyId);
            json.calledWith(match(expectedResult));            
        });
        
        it('should return error if there is a server error', async () => {
            mockStoryFindById.throws(error);
            
            await fixture.get_story(req, res);
            
            assert.calledWith(Story.findById, storyId);
            status.calledWith(500);
            send.calledWith(match(error));
        });
    });

    describe('get stories by meeting id', () => {
        let expectedResponse;
        let mockStoryFind;
        const meetingId = '123';

        beforeEach(() => {
            mockStoryFind = stub(Story, 'find');
        });

        afterEach(() => {
            mockStoryFind.restore();
        });

        it('should return story list for given meeting id', async () => {
            expectedResponse = [ {_id: 'id1', name: 'story a', meeting: {_id: '123'}},
                                 {_id: 'id2', name: 'story b', meeting: {_id: '123'}} ];

            _.set(req, 'query.meetingId', meetingId);

            mockStoryFind.returns(expectedResponse);

            await fixture.get_stories_by_meetingId(req, res);

            assert.calledWith(mockStoryFind, {meeting: { _id: meetingId } });
            assert.calledWith(res.json, expectedResponse);
        });


        it('should return error if there is a server error', async () => {
            mockStoryFind.throws(error);

            _.set(req, 'query.meetingId', meetingId);
            await fixture.get_stories_by_meetingId(req, res);

            assert.calledWith(mockStoryFind, {meeting: { _id: meetingId } });
            status.calledWith(500);
            send.calledWith(match(error));
        });
    });

    describe('create story', () => {
        const meetingId = 123;
        let mockMeetingFindById, mockStorySave;

        beforeEach(() => {
            mockMeetingFindById = stub(Meeting, 'findById');
            mockStorySave = stub(Story.prototype, 'save');
        });

        afterEach(() => {
            mockMeetingFindById.restore();
            mockStorySave.restore();
        });

        it('should create story given meeting id', async () => {
            const successMessage = {message: 'Story successfully created'};
            const foundMeeting = {_id: meetingId, name: 'meeting a'};

            _.set(req, 'body', {name: 'story a'});
            _.set(req, 'query.meetingId', meetingId);

            mockMeetingFindById.returns(foundMeeting);
            mockStorySave.returns({name: 'story a', meeting: foundMeeting});

            await fixture.create_story(req, res);

            assert.calledWith(mockStorySave);
            assert.calledWith(mockMeetingFindById, meetingId);
            assert.calledWith(res.json, successMessage);
        });
    });

    describe('delete story', () => {
        let expectedResponse;
        let mockStoryDeleteOne;
        const storyId = '123';

        beforeEach(() => {
            mockStoryDeleteOne = stub(Story, 'deleteOne');
        });

        afterEach(() => {
            mockStoryDeleteOne.restore();
        });

        it('should delete a story ', async () => {
            expectedResponse = {message: 'Story successfully removed'};

            mockStoryDeleteOne.returns({});

            _.set(req, 'params.storyId', storyId);

            await fixture.delete_story(req, res);

            assert.calledWith(mockStoryDeleteOne, {_id: storyId});
            assert.calledWith(res.json, expectedResponse);
        });


        it('should return error if there is a server error', async () => {
            mockStoryDeleteOne.throws(error);
            _.set(req, 'params.storyId', storyId);

            await fixture.delete_story(req, res);

            assert.calledWith(mockStoryDeleteOne, {_id: storyId});
            status.calledWith(500);
            send.calledWith(match(error));
        });
    });

    describe('list story estimates', () => {
        let expectedResponse;
        let mockStoryFindById;
        const storyId = '123';

        beforeEach(() => {
            mockStoryFindById = stub(Story, 'findById');
        });

        afterEach(() => {
            mockStoryFindById.restore();
        });

        it('should list estimates of the story ', async () => {
            expectedResponse = [];
            expectedStory = {
                _id: storyId, 
                name: 'story a', 
                meeting: {
                    _id: '123'
                },
                estimates: expectedResponse
            };

            mockStoryFindById.returns(expectedStory);
            _.set(req, 'params.storyId', storyId);

            await fixture.list_story_estimates(req, res);

            assert.calledWith(mockStoryFindById, storyId);
            assert.calledWith(res.json, expectedResponse);
        });


        it('should return error if there is a server error', async () => {
            mockStoryFindById.throws(error);
            _.set(req, 'params.storyId', storyId);

            await fixture.list_story_estimates(req, res);

            assert.calledWith(mockStoryFindById, storyId);
            status.calledWith(500);
            send.calledWith(match(error));
        });
    });

    describe('delete story estimates', () => {
        let expectedResponse;
        let mockStoreFindOneAndUpdate;
        const storyId = '123';
        const estimateId = 'abc123';

        beforeEach(() => {
            mockStoreFindOneAndUpdate = stub(Story, 'findOneAndUpdate');
        });

        afterEach(() => {
            mockStoreFindOneAndUpdate.restore();
        });

        it('should delete estimates of the story ', async () => {
            expectedResponse = {message: 'Estimate successfully removed'};

            mockStoreFindOneAndUpdate.returns({});
            _.set(req, 'params.storyId', storyId);
            _.set(req, 'params.estimateId', estimateId);

            await fixture.delete_story_estimate(req, res);

            assert.calledWith(mockStoreFindOneAndUpdate, {_id: storyId}, { $pullAll: { estimates: [estimateId] } });
            assert.calledWith(res.json, expectedResponse);
        });


        it('should return error if there is a server error', async () => {
            mockStoreFindOneAndUpdate.throws(error);
            _.set(req, 'params.storyId', storyId);
            _.set(req, 'params.estimateId', estimateId);

            await fixture.delete_story_estimate(req, res);

            assert.calledWith(mockStoreFindOneAndUpdate, {_id: storyId}, { $pullAll: { estimates: [estimateId] } });
            status.calledWith(500);
            send.calledWith(match(error));
        });
    });

});

