import fs from 'fs';

export class FileStorage {
  constructor(destination = 'local') {
    this.destination = destination;

    switch (destination) {
      case 'local':
        this.save = this.saveLocal;
        break;
      default:
    }
  }

  saveLocal(file) {
    fs.writeFile('/tmp/test', file);
  }
}
