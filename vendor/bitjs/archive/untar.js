/**
 * untar.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 *
 * Reference Documentation:
 *
 * TAR format: http://www.gnu.org/software/automake/manual/tar/Standard.html
 */

// This file expects to be invoked as a Worker (see onmessage below).
importScripts('../io/bytestream.js');
importScripts('archive.js');

// Progress variables.
let currentFilename = "";
let currentFileNumber = 0;
let currentBytesUnarchivedInFile = 0;
let currentBytesUnarchived = 0;
let totalUncompressedBytesInArchive = 0;
let totalFilesInArchive = 0;

// Helper functions.
const info = function(str) {
  postMessage(new bitjs.archive.UnarchiveInfoEvent(str));
};
const err = function(str) {
  postMessage(new bitjs.archive.UnarchiveErrorEvent(str));
};
const postProgress = function() {
  postMessage(new bitjs.archive.UnarchiveProgressEvent(
      currentFilename,
      currentFileNumber,
      currentBytesUnarchivedInFile,
      currentBytesUnarchived,
      totalUncompressedBytesInArchive,
      totalFilesInArchive));
};

// Removes all characters from the first zero-byte in the string onwards.
const readCleanString = function(bstr, numBytes) {
  const str = bstr.readString(numBytes);
  const zIndex = str.indexOf(String.fromCharCode(0));
  return zIndex != -1 ? str.substr(0, zIndex) : str;
};

class TarLocalFile {
  // takes a ByteStream and parses out the local file information
  constructor(bstream) {
    this.isValid = false;

    // Read in the header block
    this.name = readCleanString(bstream, 100);
    this.mode = readCleanString(bstream, 8);
    this.uid = readCleanString(bstream, 8);
    this.gid = readCleanString(bstream, 8);
    this.size = parseInt(readCleanString(bstream, 12), 8);
    this.mtime = readCleanString(bstream, 12);
    this.chksum = readCleanString(bstream, 8);
    this.typeflag = readCleanString(bstream, 1);
    this.linkname = readCleanString(bstream, 100);
    this.maybeMagic = readCleanString(bstream, 6);

    if (this.maybeMagic == "ustar") {
      this.version = readCleanString(bstream, 2);
      this.uname = readCleanString(bstream, 32);
      this.gname = readCleanString(bstream, 32);
      this.devmajor = readCleanString(bstream, 8);
      this.devminor = readCleanString(bstream, 8);
      this.prefix = readCleanString(bstream, 155);

      if (this.prefix.length) {
        this.name = this.prefix + this.name;
      }
      bstream.readBytes(12); // 512 - 500
    } else {
      bstream.readBytes(255); // 512 - 257
    }

    // Done header, now rest of blocks are the file contents.
    this.filename = this.name;
    this.fileData = null;

    info("Untarring file '" + this.filename + "'");
    info("  size = " + this.size);
    info("  typeflag = " + this.typeflag);

    // A regular file.
    if (this.typeflag == 0) {
      info("  This is a regular file.");
      const sizeInBytes = parseInt(this.size);
      this.fileData = new Uint8Array(bstream.readBytes(sizeInBytes));
      if (this.name.length > 0 && this.size > 0 && this.fileData && this.fileData.buffer) {
        this.isValid = true;
      }

      bstream.readBytes(this.size);

      // Round up to 512-byte blocks.
      const remaining = 512 - bstream.ptr % 512;
      if (remaining > 0 && remaining < 512) {
        bstream.readBytes(remaining);
      }
    } else if (this.typeflag == 5) {
       info("  This is a directory.")
    }
  }
}

// Takes an ArrayBuffer of a tar file in
// returns null on error
// returns an array of DecompressedFile objects on success
const untar = function(arrayBuffer) {
  currentFilename = "";
  currentFileNumber = 0;
  currentBytesUnarchivedInFile = 0;
  currentBytesUnarchived = 0;
  totalUncompressedBytesInArchive = 0;
  totalFilesInArchive = 0;

  postMessage(new bitjs.archive.UnarchiveStartEvent());
  const bstream = new bitjs.io.ByteStream(arrayBuffer);
  const localFiles = [];

  // While we don't encounter an empty block, keep making TarLocalFiles.
  while (bstream.peekNumber(4) != 0) {
    const oneLocalFile = new TarLocalFile(bstream);
    if (oneLocalFile && oneLocalFile.isValid) {
      localFiles.push(oneLocalFile);
      totalUncompressedBytesInArchive += oneLocalFile.size;
    }
  }
  totalFilesInArchive = localFiles.length;

  // got all local files, now sort them
  localFiles.sort((a,b) => a.filename > b.filename ? 1 : -1);

  // report # files and total length
  if (localFiles.length > 0) {
    postProgress();
  }

  // now do the shipping of each file
  for (let i = 0; i < localFiles.length; ++i) {
    const localfile = localFiles[i];
    info("Sending file '" + localfile.filename + "' up");

    // update progress
    currentFilename = localfile.filename;
    currentFileNumber = i;
    currentBytesUnarchivedInFile = localfile.size;
    currentBytesUnarchived += localfile.size;
    postMessage(new bitjs.archive.UnarchiveExtractEvent(localfile));
    postProgress();
  }

  postProgress();

  postMessage(new bitjs.archive.UnarchiveFinishEvent());
};

// event.data.file has the ArrayBuffer.
onmessage = function(event) {
  const ab = event.data.file;
  untar(ab);
};
