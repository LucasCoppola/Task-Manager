const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
const { Schema } = mongoose

const taskSchema = new Schema({
	name: { type: String, required: true }
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task
