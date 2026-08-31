// Lumino subclasses DragEvent while loading, but jsdom does not implement it.
global.DragEvent = class DragEvent extends MouseEvent {};
