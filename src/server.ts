/**
 * Setup express server.
 */

import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import helmet from 'helmet';
import express, { Request, Response, NextFunction } from 'express';
import logger from 'jet-logger';
import cors from 'cors'
import 'express-async-errors';

import BaseRouter from '@src/routes/api';
import Paths from '@src/constants/Paths';

import EnvVars from '@src/constants/EnvVars';
import HttpStatusCodes from '@src/constants/HttpStatusCodes';
import { readFile } from 'node:fs/promises';
import { NodeEnvs } from '@src/constants/misc';
import { RouteError } from '@src/other/classes';
// TextGears library import
import textGears from 'textgears-api';

const textgearsApi = textGears(EnvVars.TextGears, {language: 'en-US'});

// SpellCheck library import

import {SymSpellEx, MemoryStore} from 'symspell-ex';
const symSpellEx = new SymSpellEx(new MemoryStore());
// (async () => {
//   await symSpellEx.initialize();
//   const englishJsonDictionary= await readFile(__dirname + '/words_dictionary.json', { encoding: 'utf8' });
//
//   const jsonObj = Object.keys((JSON.parse(englishJsonDictionary)));
//   // Create SymSpellEx instance and inject store new store instance
//
//   const terms = [...jsonObj];
//   const LANGUAGE = 'en';
//   await symSpellEx.train(terms,LANGUAGE);
// })()


// **** Variables **** //

const app = express();


// **** Setup **** //

// Basic middleware
app.use(cors({
  origin:['http://localhost:5173', 'https://spellcheck-client.onrender.com']
}))
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser(EnvVars.CookieProps.Secret));

// Show routes called in console during development
if (EnvVars.NodeEnv === NodeEnvs.Dev.valueOf()) {
  app.use(morgan('dev'));
}

// Security
if (EnvVars.NodeEnv === NodeEnvs.Production.valueOf()) {
  app.use(helmet());
}

// Add APIs, must be after middleware
app.use(Paths.Base, BaseRouter);

// Add error handler
app.use((
  err: Error,
  _: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  if (EnvVars.NodeEnv !== NodeEnvs.Test.valueOf()) {
    logger.err(err, true);
  }
  let status = HttpStatusCodes.BAD_REQUEST;
  if (err instanceof RouteError) {
    status = err.status;
  }
  return res.status(status).json({ error: err.message });
});


// ** Front-End Content ** //

// Set views directory (html)
const viewsDir = path.join(__dirname, 'views');
app.set('views', viewsDir);

// Set static directory (js and css).
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Nav to login pg by default
app.get('/', (_: Request, res: Response) => {
  res.sendFile('login.html', { root: viewsDir });
});

app.post('/textgears/spellcheck',async (req,res) => {
  if(req.body.text.length === 0) {
    return res.status(204).send()
  }
  const data = await textgearsApi.checkGrammar(req.body.text)
  res.json(data.response.errors)
})

app.get('/symspell/load/spellcheck', async (_:Request, res:Response) => {
  // Load words dictionary
  res.sendFile('spellcheck.html', {root: viewsDir});
})

app.post('/symspell/spellcheck', async (req:Request, res:Response) => {
  const output =  (await symSpellEx.correct(req.body.text, 'en')).output;
  res.status(201).json(output)
})
// Redirect to login if not logged in.
app.get('/users', (req: Request, res: Response) => {
  const jwt = req.signedCookies[EnvVars.CookieProps.Key];
  if (!jwt) {
    res.redirect('/');
  } else {
    res.sendFile('users.html', {root: viewsDir});
  }
});


// **** Export default **** //

export default app;
