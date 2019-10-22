require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const {
  NODE_ENV
} = require('./config')
const uuid = require('uuid/v4');
const bodyParser = require('body-parser')

const bookmarkGET = require('./bookmark/bookmark-get')
const bookmarkGETid = require('./bookmark/bookmark-get-id')
const bookmarkPOST = require('./bookmark/bookmark-post')
const bookmarkDELETE = require('./bookmark/bookmark-delete')

const app = express()

const morganOption = (NODE_ENV === 'production') ?
  'tiny' :
  'common';

app.use(morgan(morganOption))
app.use(cors())
app.use(helmet())
app.use(express.json());
app.use(bodyParser())

app.use(bookmarkGET)
app.use(bookmarkGETid)
app.use(bookmarkPOST)
app.use(bookmarkDELETE)

/////////////////////////

// app.use(function validateBearerToken(req, res, next) {
//   const apiToken = process.env.API_TOKEN
//   const authToken = req.get('Authorization')

//   if (!authToken || authToken.split(' ')[1] !== apiToken) {
//     logger.error(`Unauthorized request to path: ${req.path}`);
//     return res.status(401).json({ error: 'Unauthorized request' })
//   }
//   // move to the next middleware
//   next()
// })

const cards = [{
  id: 1,
  title: 'Task One',
  content: 'This is card one'
}];

const lists = [{
  id: 1,
  header: 'List One',
  cardIds: [1]
}];

const BOOKMARK = require('./bookmark/bookmark') // new data store

app.get('/', (req, res) => {
  res
    .send('It works!');
});

app.get('/card', (req, res) => {
  res
    .json(cards);
});

app.get('/card/:id', (req, res) => {
  const {
    id
  } = req.params;
  const card = cards.find(c => c.id == id);

  // make sure we found a card
  if (!card) {
    logger.error(`Card with id ${id} not found.`);
    return res
      .status(404)
      .send('Card Not Found');
  }

  res.json(card);
});

app.post('/card', (req, res) => {
  const {
    title,
    content
  } = req.body;

  if (!title) {
    logger.error(`Title is required`);
    return res
      .status(400)
      .send('Invalid data');
  }

  if (!content) {
    logger.error(`Content is required`);
    return res
      .status(400)
      .send('Invalid data');
  }

  const id = uuid();

  const card = {
    id,
    title,
    content
  };

  cards.push(card);

  logger.info(`Card with id ${id} created`);

  res
    .status(201)
    .location(`http://localhost:8000/card/${id}`)
    .json({
      id
    });
})

app.delete('/card/:id', (req, res) => {
  const {
    id
  } = req.params;

  const cardIndex = cards.findIndex(c => c.id === id);

  if (cardIndex === -1) {
    logger.error(`Card with id ${id} not found.`);
    return res
      .status(404)
      .send('Not found');
  }

  //remove card from lists
  //assume cardIds are not duplicated in the cardIds array
  lists.forEach(list => {
    const cardIds = list.cardIds.filter(cid => cid !== id);
    list.cardIds = cardIds;
  });

  cards.splice(cardIndex, 1);

  logger.info(`Card with id ${id} deleted.`);

  res
    .status(204)
    .end();
});

app.get('/list', (req, res) => {
  res
    .json(lists);
});

app.get('/list/:id', (req, res) => {
  const {
    id
  } = req.params;
  const list = lists.find(li => li.id == id);

  // make sure we found a list
  if (!list) {
    logger.error(`List with id ${id} not found.`);
    return res
      .status(404)
      .send('List Not Found');
  }

  res.json(list);
});

app.post('/list', (req, res) => {
  const {
    header,
    cardIds = []
  } = req.body;
  if (!header) {
    logger.error(`Header is required`);
    return res
      .status(400)
      .send('Invalid data');
  }

  // check card ids
  if (cardIds.length > 0) {
    let valid = true;
    cardIds.forEach(cid => {
      const card = cards.find(c => c.id == cid);
      if (!card) {
        logger.error(`Card with id ${cid} not found in cards array.`);
        valid = false;
      }
    });

    if (!valid) {
      return res
        .status(400)
        .send('Invalid data');
    }
  }

  // get an id
  const id = uuid();

  const list = {
    id,
    header,
    cardIds
  };

  lists.push(list);

  logger.info(`List with id ${id} created`);

  res
    .status(201)
    .location(`http://localhost:8000/list/${id}`)
    .json({
      id
    });

});

app.delete('/list/:id', (req, res) => {
  const {
    id
  } = req.params;

  const listIndex = lists.findIndex(li => li.id === id);

  if (listIndex === -1) {
    logger.error(`List with id ${id} not found.`);
    return res
      .status(404)
      .send('Not Found');
  }

  lists.splice(listIndex, 1);

  logger.info(`List with id ${id} deleted.`);
  res
    .status(204)
    .end();

});

// app.get('/bookmark', (req, res) => {
//   res
//     .json(BOOKMARK);
// });

// app.get('/bookmark/:id', (req, res) => {
//   const {
//     id
//   } = req.params;
//   const bookmark = BOOKMARK.find(c => c.id == id);

//   // make sure we found a bookmark
//   if (!bookmark) {
//     logger.error(`Bookmark with id ${id} not found.`);
//     return res
//       .status(404)
//       .send('Bookmark Not Found');
//   }

//   res.json(bookmark);
// });

// app.post('/bookmark', (req, res) => {
//   const {
//     title,
//     content
//   } = req.body;

//   if (!title) {
//     logger.error(`Title is required`);
//     return res
//       .status(400)
//       .send('Invalid data');
//   }

//   if (!content) {
//     logger.error(`Content is required`);
//     return res
//       .status(400)
//       .send('Invalid data');
//   }

//   console.log(`before uuid`)
//   const uuid = BOOKMARK.length + 1;
//   console.log(`passed uuid`)

//   const bookmark = {
//     uuid,
//     title,
//     content
//   };

//   BOOKMARK.push(bookmark);

//   logger.info(`Bookmark with id ${uuid} created`);

//   res
//     .status(201)
//     .location(`http://localhost:8000/bookmark/${uuid}`)
//     .json({
//       uuid
//     });
// })

///////////////////////

app.use(function errorHandler(error, req, res, next) {
  let response
  if (NODE_ENV === 'production') {
    response = {
      error: {
        message: 'server error'
      }
    }
  } else {
    console.error(error)
    response = {
      message: error.message,
      error
    }
  }
  res.status(500).json(response)
})

module.exports = app