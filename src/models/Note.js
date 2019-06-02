import { Schema, model } from 'mongoose';

const NoteSchema = new Schema({
  title: String,
  description: String,
});

const Note = model('Note', PostSchema);
export default Note;
