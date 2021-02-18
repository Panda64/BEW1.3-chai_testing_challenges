require('dotenv').config()
const app = require('../server.js')
const mongoose = require('mongoose')
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = chai.assert

const User = require('../models/user.js')
const Message = require('../models/message.js')

chai.config.includeStack = true

const expect = chai.expect
const should = chai.should()
chai.use(chaiHttp)

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.close()
  done()
})

const SAMPLE_USER_ID = 'bbbbbbbbbbbb' // 12 byte string
const SAMPLE_MESSAGE_ID = 'cccccccccccc'


describe('Message API endpoints', () => {
    beforeEach((done) => {
        const sampleUser = new User({
            username: 'myuser',
            password: 'mypassword',
            _id: SAMPLE_USER_ID
        })
        sampleUser.save()

        const sampleMessage = new Message({
            title: 'test title one',
            body: 'this is a test of the message body',
            author: sampleUser,
            _id: SAMPLE_MESSAGE_ID
        })
        sampleMessage.save()
        .then(() => {
            done()
        })
    })

    afterEach((done) => {
        Message.deleteMany({ title: ['test title one', 'test title two', 'test title three'] })
        .then(() => {
           return User.deleteOne({ username: ['myuser'] }) 
        })
        .then(() => {
            done()
        })
    })

    it('should load all messages', (done) => {
        chai.request(app)
        .get('/messages')
        .end((err, res) => {
            if (err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body.messages).to.be.an("array")
            done()
        })
    })

    it('should get one specific message', (done) => {
        chai.request(app)
        .get(`/messages/${SAMPLE_MESSAGE_ID}`)
        .end((err, res) => {
            if (err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(res.body.title).to.equal('test title one')
            expect(res.body.body).to.equal('this is a test of the message body')
            done()
        })
    })

    it('should post a new message', (done) => {
        chai.request(app)
        .post('/messages')
        .send({title: 'test title two', body: 'this is ANOTHER test of the message body', author: SAMPLE_USER_ID})
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('title', 'test title two')

            // check that message is actually inserted into database
            Message.findOne({title: 'test title two'}).then(message => {
                expect(message).to.be.an('object')
                done()
            })
        })
    })

    it('should update a message', (done) => {
        chai.request(app)
        .put(`/messages/${SAMPLE_MESSAGE_ID}`)
        .send({title: 'test title three'})
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body).to.be.an('object')
            expect(res.body.title).to.equal('test title three')

            // check that user is actually inserted into database
            Message.findOne({title: 'test title three'}).then(message => {
                expect(message).to.be.an('object')
                done()
            })
        })
    })

    it('should delete a message', (done) => {
        chai.request(app)
        .delete(`/messages/${SAMPLE_MESSAGE_ID}`)
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.equal('Successfully deleted.')
            expect(res.body._id).to.equal(SAMPLE_MESSAGE_ID)

            // check that user is actually deleted from database
            Message.findOne({title: 'title test one'}).then(message => {
                expect(message).to.equal(null)
                done()
            })
        })
    })
})
