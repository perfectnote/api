import { Schema, model } from 'mongoose';

const NoteSchema = new Schema({
  _id: String,
  name: String,
  description: String,
  owner: String
});

const Note = model('Note', NoteSchema);
export default Note;
