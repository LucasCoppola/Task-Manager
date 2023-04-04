if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config()
}

const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
const Task = require('./schemas')
const methodOverride = require('method-override')
const ExpressError = require('./AppErrors/ExpressError')
const catchAsync = require('./AppErrors/catchAsync')
const cors = require('cors')
const flash = require('connect-flash')
const session = require('express-session')

const dbUrl = process.env.DB_URL

mongoose
	.connect(dbUrl, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false
	})
	.then(() => {
		console.log('Database Connected')
	})
	.catch((e) => {
		console.log(e)
		process.exit(1)
	})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(methodOverride('_method'))
app.use(flash())
app.use(
	cors({
		methods: ['GET', 'POST', 'PUT', 'DELETE'], // replace with the allowed methods
		credentials: true // enable cookies and session data to be shared across domains
	})
)
app.use(
	session({
		secret: 'secret',
		resave: false,
		saveUninitialized: true
	})
)
// ROUTES
app.get(
	'/',
	catchAsync(async (req, res) => {
		const tasks = await Task.find({})
		res.render('home', { tasks, error: req.flash('error'), success: req.flash('success') })
	})
)

app.post(
	'/',
	catchAsync(async (req, res) => {
		const { name } = req.body
		if (!name) {
			req.flash('error', 'Write something')
			return res.redirect('/')
		}
		const task = new Task({ name })
		await task.save()
		req.flash('success', 'Task added!')
		res.redirect('/')
	})
)

app.get(
	'/:id',
	catchAsync(async (req, res) => {
		const { id } = req.params
		const task = await Task.findById(id)
		if (!task) {
			req.flash('error', 'task not found')
			return res.redirect('/')
		}
		res.render('task', { task })
	})
)

app.put(
	'/:id',
	catchAsync(async (req, res) => {
		const { id } = req.params
		const { name } = req.body
		const task = await Task.findByIdAndUpdate(id, { name })
		await task.save()
		req.flash('success', 'Updated!')
		res.redirect('/')
	})
)

app.delete(
	'/:id',
	catchAsync(async (req, res) => {
		const { id } = req.params
		await Task.findByIdAndDelete(id)
		req.flash('error', 'Deleted!')
		res.redirect('/')
	})
)

app.all('*', (req, res, next) => {
	next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
	if (err.name === 'CastError') {
		// Handle the cast error here
		console.error('Invalid ID format')
		req.flash('error', 'Invalid ID format')
		res.redirect('/')
	} else {
		// Handle other errors
		const { statusCode = 500, message = 'Oh No, Something Went Wrong!' } = err
		req.flash('error', message)
		res.redirect('/')
	}
})

const port = process.env.PORT || 3000

app.listen(port, () => {
	console.log('Listening On Port 5000')
})
