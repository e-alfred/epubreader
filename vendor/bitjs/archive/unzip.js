/**
 * unzip.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 * Copyright(c) 2011 antimatter15
 *
 * Reference Documentation:
 *
 * ZIP format: http://www.pkware.com/documents/casestudies/APPNOTE.TXT
 * DEFLATE format: http://tools.ietf.org/html/rfc1951
 */

// This file expects to be invoked as a Worker (see onmessage below).
// ...
// ... but importScripts does not work when CSP2 nonce is active, so inline these instead...
//importScripts('../io/bitstream.js');
//

/*
 * bitstream.js
 *
 * Provides readers for bitstreams.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 * Copyright(c) 2011 antimatter15
 */

var bitjs = bitjs || {};
bitjs.io = bitjs.io || {};


/**
 * This bit stream peeks and consumes bits out of a binary stream.
 */
bitjs.io.BitStream = class {
  /**
   * @param {ArrayBuffer} ab An ArrayBuffer object or a Uint8Array.
   * @param {boolean} rtl Whether the stream reads bits from the byte starting
   *     from bit 7 to 0 (true) or bit 0 to 7 (false).
   * @param {Number} opt_offset The offset into the ArrayBuffer
   * @param {Number} opt_length The length of this BitStream
   */
  constructor(ab, rtl, opt_offset, opt_length) {
    if (!ab || !ab.toString || ab.toString() !== "[object ArrayBuffer]") {
      throw "Error! BitArray constructed with an invalid ArrayBuffer object";
    }

    const offset = opt_offset || 0;
    const length = opt_length || ab.byteLength;
    this.bytes = new Uint8Array(ab, offset, length);
    this.bytePtr = 0; // tracks which byte we are on
    this.bitPtr = 0; // tracks which bit we are on (can have values 0 through 7)
    this.peekBits = rtl ? this.peekBits_rtl : this.peekBits_ltr;
  }

  /**
   *   byte0      byte1      byte2      byte3
   * 7......0 | 7......0 | 7......0 | 7......0
   *
   * The bit pointer starts at bit0 of byte0 and moves left until it reaches
   * bit7 of byte0, then jumps to bit0 of byte1, etc.
   * @param {number} n The number of bits to peek.
   * @param {boolean=} movePointers Whether to move the pointer, defaults false.
   * @return {number} The peeked bits, as an unsigned number.
   */
  peekBits_ltr(n, opt_movePointers) {
    if (n <= 0 || typeof n != typeof 1) {
      return 0;
    }

    const movePointers = opt_movePointers || false;
    const bytes = this.bytes;
    let bytePtr = this.bytePtr;
    let bitPtr = this.bitPtr;
    let result = 0;
    let bitsIn = 0;

    // keep going until we have no more bits left to peek at
    // TODO: Consider putting all bits from bytes we will need into a variable and then
    //       shifting/masking it to just extract the bits we want.
    //       This could be considerably faster when reading more than 3 or 4 bits at a time.
    while (n > 0) {
      if (bytePtr >= bytes.length) {
        throw "Error!  Overflowed the bit stream! n=" + n + ", bytePtr=" + bytePtr + ", bytes.length=" +
          bytes.length + ", bitPtr=" + bitPtr;
        return -1;
      }

      const numBitsLeftInThisByte = (8 - bitPtr);
      if (n >= numBitsLeftInThisByte) {
        const mask = (bitjs.io.BitStream.BITMASK[numBitsLeftInThisByte] << bitPtr);
        result |= (((bytes[bytePtr] & mask) >> bitPtr) << bitsIn);

        bytePtr++;
        bitPtr = 0;
        bitsIn += numBitsLeftInThisByte;
        n -= numBitsLeftInThisByte;
      }
      else {
        const mask = (bitjs.io.BitStream.BITMASK[n] << bitPtr);
        result |= (((bytes[bytePtr] & mask) >> bitPtr) << bitsIn);

        bitPtr += n;
        bitsIn += n;
        n = 0;
      }
    }

    if (movePointers) {
      this.bitPtr = bitPtr;
      this.bytePtr = bytePtr;
    }

    return result;
  }

  /**
   *   byte0      byte1      byte2      byte3
   * 7......0 | 7......0 | 7......0 | 7......0
   *
   * The bit pointer starts at bit7 of byte0 and moves right until it reaches
   * bit0 of byte0, then goes to bit7 of byte1, etc.
   * @param {number} n The number of bits to peek.
   * @param {boolean=} movePointers Whether to move the pointer, defaults false.
   * @return {number} The peeked bits, as an unsigned number.
   */
  peekBits_rtl(n, opt_movePointers) {
    if (n <= 0 || typeof n != typeof 1) {
      return 0;
    }

    const movePointers = opt_movePointers || false;
    const bytes = this.bytes;
    let bytePtr = this.bytePtr;
    let bitPtr = this.bitPtr;
    let result = 0;

    // keep going until we have no more bits left to peek at
    // TODO: Consider putting all bits from bytes we will need into a variable and then
    //       shifting/masking it to just extract the bits we want.
    //       This could be considerably faster when reading more than 3 or 4 bits at a time.
    while (n > 0) {
      if (bytePtr >= bytes.length) {
        throw "Error!  Overflowed the bit stream! n=" + n + ", bytePtr=" + bytePtr + ", bytes.length=" +
          bytes.length + ", bitPtr=" + bitPtr;
        return -1;
      }

      const numBitsLeftInThisByte = (8 - bitPtr);
      if (n >= numBitsLeftInThisByte) {
        result <<= numBitsLeftInThisByte;
        result |= (bitjs.io.BitStream.BITMASK[numBitsLeftInThisByte] & bytes[bytePtr]);
        bytePtr++;
        bitPtr = 0;
        n -= numBitsLeftInThisByte;
      }
      else {
        result <<= n;
        result |= ((bytes[bytePtr] & (bitjs.io.BitStream.BITMASK[n] << (8 - n - bitPtr))) >> (8 - n - bitPtr));

        bitPtr += n;
        n = 0;
      }
    }

    if (movePointers) {
      this.bitPtr = bitPtr;
      this.bytePtr = bytePtr;
    }

    return result;
  }

  /**
   * Peek at 16 bits from current position in the buffer.
   * Bit at (bytePtr,bitPtr) has the highest position in returning data.
   * Taken from getbits.hpp in unrar.
   * TODO: Move this out of BitStream and into unrar.
   */
  getBits() {
    return (((((this.bytes[this.bytePtr] & 0xff) << 16) +
                ((this.bytes[this.bytePtr+1] & 0xff) << 8) +
                ((this.bytes[this.bytePtr+2] & 0xff))) >>> (8-this.bitPtr)) & 0xffff);
  }

  /**
   * Reads n bits out of the stream, consuming them (moving the bit pointer).
   * @param {number} n The number of bits to read.
   * @return {number} The read bits, as an unsigned number.
   */
  readBits(n) {
    return this.peekBits(n, true);
  }

  /**
   * This returns n bytes as a sub-array, advancing the pointer if movePointers
   * is true.  Only use this for uncompressed blocks as this throws away remaining
   * bits in the current byte.
   * @param {number} n The number of bytes to peek.
   * @param {boolean=} movePointers Whether to move the pointer, defaults false.
   * @return {Uint8Array} The subarray.
   */
  peekBytes(n, opt_movePointers) {
    if (n <= 0 || typeof n != typeof 1) {
      return 0;
    }

    // from http://tools.ietf.org/html/rfc1951#page-11
    // "Any bits of input up to the next byte boundary are ignored."
    while (this.bitPtr != 0) {
      this.readBits(1);
    }

    const movePointers = opt_movePointers || false;
    let bytePtr = this.bytePtr;
    let bitPtr = this.bitPtr;

    const result = this.bytes.subarray(bytePtr, bytePtr + n);

    if (movePointers) {
      this.bytePtr += n;
    }

    return result;
  }

  /**
   * @param {number} n The number of bytes to read.
   * @return {Uint8Array} The subarray.
   */
  readBytes(n) {
    return this.peekBytes(n, true);
  }
}

// mask for getting N number of bits (0-8)
bitjs.io.BitStream.BITMASK = [0, 0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3F, 0x7F, 0xFF ];

//importScripts('../io/bytebuffer.js');
//

/*
 * bytestream.js
 *
 * Provides a writer for bytes.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 * Copyright(c) 2011 antimatter15
 */

var bitjs = bitjs || {};
bitjs.io = bitjs.io || {};


/**
 * A write-only Byte buffer which uses a Uint8 Typed Array as a backing store.
 */
bitjs.io.ByteBuffer = class {
  /**
   * @param {number} numBytes The number of bytes to allocate.
   */
  constructor(numBytes) {
    if (typeof numBytes != typeof 1 || numBytes <= 0) {
      throw "Error! ByteBuffer initialized with '" + numBytes + "'";
    }
    this.data = new Uint8Array(numBytes);
    this.ptr = 0;
  }


  /**
   * @param {number} b The byte to insert.
   */
  insertByte(b) {
    // TODO: throw if byte is invalid?
    this.data[this.ptr++] = b;
  }

  /**
   * @param {Array.<number>|Uint8Array|Int8Array} bytes The bytes to insert.
   */
  insertBytes(bytes) {
    // TODO: throw if bytes is invalid?
    this.data.set(bytes, this.ptr);
    this.ptr += bytes.length;
  }

  /**
   * Writes an unsigned number into the next n bytes.  If the number is too large
   * to fit into n bytes or is negative, an error is thrown.
   * @param {number} num The unsigned number to write.
   * @param {number} numBytes The number of bytes to write the number into.
   */
  writeNumber(num, numBytes) {
    if (numBytes < 1) {
      throw 'Trying to write into too few bytes: ' + numBytes;
    }
    if (num < 0) {
      throw 'Trying to write a negative number (' + num +
          ') as an unsigned number to an ArrayBuffer';
    }
    if (num > (Math.pow(2, numBytes * 8) - 1)) {
      throw 'Trying to write ' + num + ' into only ' + numBytes + ' bytes';
    }

    // Roll 8-bits at a time into an array of bytes.
    const bytes = [];
    while (numBytes-- > 0) {
      const eightBits = num & 255;
      bytes.push(eightBits);
      num >>= 8;
    }

    this.insertBytes(bytes);
  }

  /**
   * Writes a signed number into the next n bytes.  If the number is too large
   * to fit into n bytes, an error is thrown.
   * @param {number} num The signed number to write.
   * @param {number} numBytes The number of bytes to write the number into.
   */
  writeSignedNumber(num, numBytes) {
    if (numBytes < 1) {
      throw 'Trying to write into too few bytes: ' + numBytes;
    }

    const HALF = Math.pow(2, (numBytes * 8) - 1);
    if (num >= HALF || num < -HALF) {
      throw 'Trying to write ' + num + ' into only ' + numBytes + ' bytes';
    }

    // Roll 8-bits at a time into an array of bytes.
    const bytes = [];
    while (numBytes-- > 0) {
      const eightBits = num & 255;
      bytes.push(eightBits);
      num >>= 8;
    }

    this.insertBytes(bytes);
  }

  /**
   * @param {string} str The ASCII string to write.
   */
  writeASCIIString(str) {
    for (let i = 0; i < str.length; ++i) {
      const curByte = str.charCodeAt(i);
      if (curByte < 0 || curByte > 255) {
        throw 'Trying to write a non-ASCII string!';
      }
      this.insertByte(curByte);
    }
  };
}
//importScripts('../io/bytestream.js');
//

/*
 * bytestream.js
 *
 * Provides readers for byte streams.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 * Copyright(c) 2011 antimatter15
 */

var bitjs = bitjs || {};
bitjs.io = bitjs.io || {};


/**
 * This object allows you to peek and consume bytes as numbers and strings
 * out of an ArrayBuffer.  In this buffer, everything must be byte-aligned.
 */
bitjs.io.ByteStream = class {
  /**
   * @param {ArrayBuffer} ab The ArrayBuffer object.
   * @param {number=} opt_offset The offset into the ArrayBuffer
   * @param {number=} opt_length The length of this BitStream
   */
  constructor(ab, opt_offset, opt_length) {
    const offset = opt_offset || 0;
    const length = opt_length || ab.byteLength;
    this.bytes = new Uint8Array(ab, offset, length);
    this.ptr = 0;
  }


  /**
   * Peeks at the next n bytes as an unsigned number but does not advance the
   * pointer
   * TODO: This apparently cannot read more than 4 bytes as a number?
   * @param {number} n The number of bytes to peek at.
   * @return {number} The n bytes interpreted as an unsigned number.
   */
  peekNumber(n) {
    // TODO: return error if n would go past the end of the stream?
    if (n <= 0 || typeof n != typeof 1) {
      return -1;
    }

    let result = 0;
    // read from last byte to first byte and roll them in
    let curByte = this.ptr + n - 1;
    while (curByte >= this.ptr) {
      result <<= 8;
      result |= this.bytes[curByte];
      --curByte;
    }
    return result;
  }


  /**
   * Returns the next n bytes as an unsigned number (or -1 on error)
   * and advances the stream pointer n bytes.
   * @param {number} n The number of bytes to read.
   * @return {number} The n bytes interpreted as an unsigned number.
   */
  readNumber(n) {
    const num = this.peekNumber( n );
    this.ptr += n;
    return num;
  }


  /**
   * Returns the next n bytes as a signed number but does not advance the
   * pointer.
   * @param {number} n The number of bytes to read.
   * @return {number} The bytes interpreted as a signed number.
   */
  peekSignedNumber(n) {
    let num = this.peekNumber(n);
    const HALF = Math.pow(2, (n * 8) - 1);
    const FULL = HALF * 2;

    if (num >= HALF) num -= FULL;

    return num;
  }


  /**
   * Returns the next n bytes as a signed number and advances the stream pointer.
   * @param {number} n The number of bytes to read.
   * @return {number} The bytes interpreted as a signed number.
   */
  readSignedNumber(n) {
    const num = this.peekSignedNumber(n);
    this.ptr += n;
    return num;
  }


  /**
   * This returns n bytes as a sub-array, advancing the pointer if movePointers
   * is true.
   * @param {number} n The number of bytes to read.
   * @param {boolean} movePointers Whether to move the pointers.
   * @return {Uint8Array} The subarray.
   */
  peekBytes(n, movePointers) {
    if (n <= 0 || typeof n != typeof 1) {
      return null;
    }

    const result = this.bytes.subarray(this.ptr, this.ptr + n);

    if (movePointers) {
      this.ptr += n;
    }

    return result;
  }

  /**
   * Reads the next n bytes as a sub-array.
   * @param {number} n The number of bytes to read.
   * @return {Uint8Array} The subarray.
   */
  readBytes(n) {
    return this.peekBytes(n, true);
  }

  /**
   * Peeks at the next n bytes as a string but does not advance the pointer.
   * @param {number} n The number of bytes to peek at.
   * @return {string} The next n bytes as a string.
   */
  peekString(n) {
    if (n <= 0 || typeof n != typeof 1) {
      return "";
    }

    let result = "";
    for (let p = this.ptr, end = this.ptr + n; p < end; ++p) {
      result += String.fromCharCode(this.bytes[p]);
    }
    return result;
  }

  /**
   * Returns the next n bytes as an ASCII string and advances the stream pointer
   * n bytes.
   * @param {number} n The number of bytes to read.
   * @return {string} The next n bytes as a string.
   */
  readString(n) {
    const strToReturn = this.peekString(n);
    this.ptr += n;
    return strToReturn;
  }
}
//importScripts('archive.js');
//

/**
 * archive.js
 *
 * Provides base functionality for unarchiving.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 */

var bitjs = bitjs || {};
bitjs.archive = bitjs.archive || {};

/**
 * An unarchive event.
 */
bitjs.archive.UnarchiveEvent = class {
  /**
   * @param {string} type The event type.
   */
  constructor(type) {
    /**
     * The event type.
     * @type {string}
     */
    this.type = type;
  }
}

/**
 * The UnarchiveEvent types.
 */
bitjs.archive.UnarchiveEvent.Type = {
  START: 'start',
  PROGRESS: 'progress',
  EXTRACT: 'extract',
  FINISH: 'finish',
  INFO: 'info',
  ERROR: 'error'
};

/**
 * Useful for passing info up to the client (for debugging).
 */
bitjs.archive.UnarchiveInfoEvent = class extends bitjs.archive.UnarchiveEvent {
  /**
   * @param {string} msg The info message.
   */
  constructor(msg) {
    super(bitjs.archive.UnarchiveEvent.Type.INFO);

    /**
     * The information message.
     * @type {string}
     */
    this.msg = msg;
  }
}

/**
 * An unrecoverable error has occured.
 */
bitjs.archive.UnarchiveErrorEvent = class extends bitjs.archive.UnarchiveEvent {
  /**
   * @param {string} msg The error message.
   */
  constructor(msg) {
    super(bitjs.archive.UnarchiveEvent.Type.ERROR);

    /**
     * The information message.
     * @type {string}
     */
    this.msg = msg;
  }
}

/**
 * Start event.
 */
bitjs.archive.UnarchiveStartEvent = class extends bitjs.archive.UnarchiveEvent {
  constructor() {
    super(bitjs.archive.UnarchiveEvent.Type.START);
  }
}

/**
 * Finish event.
 */
bitjs.archive.UnarchiveFinishEvent = class extends bitjs.archive.UnarchiveEvent {
  constructor() {
    super(bitjs.archive.UnarchiveEvent.Type.FINISH);
  }
}

/**
 * Progress event.
 */
bitjs.archive.UnarchiveProgressEvent = class extends bitjs.archive.UnarchiveEvent {
  /**
   * @param {string} currentFilename
   * @param {number} currentFileNumber
   * @param {number} currentBytesUnarchivedInFile
   * @param {number} currentBytesUnarchived
   * @param {number} totalUncompressedBytesInArchive
   * @param {number} totalFilesInArchive
   */
  constructor(currentFilename, currentFileNumber, currentBytesUnarchivedInFile,
      currentBytesUnarchived, totalUncompressedBytesInArchive, totalFilesInArchive) {
    super(bitjs.archive.UnarchiveEvent.Type.PROGRESS);

    this.currentFilename = currentFilename;
    this.currentFileNumber = currentFileNumber;
    this.currentBytesUnarchivedInFile = currentBytesUnarchivedInFile;
    this.totalFilesInArchive = totalFilesInArchive;
    this.currentBytesUnarchived = currentBytesUnarchived;
    this.totalUncompressedBytesInArchive = totalUncompressedBytesInArchive;
  }
}

/**
 * Extract event.
 */
bitjs.archive.UnarchiveExtractEvent = class extends bitjs.archive.UnarchiveEvent {
  /**
   * @param {UnarchivedFile} unarchivedFile
   */
  constructor(unarchivedFile) {
    super(bitjs.archive.UnarchiveEvent.Type.EXTRACT);

    /**
     * @type {UnarchivedFile}
     */
    this.unarchivedFile = unarchivedFile;
  }
}

/**
 * All extracted files returned by an Unarchiver will implement
 * the following interface:
 *
 * interface UnarchivedFile {
 *   string filename
 *   TypedArray fileData  
 * }
 *
 */

/**
 * Base class for all Unarchivers.
 */
bitjs.archive.Unarchiver = class {
  /**
   * @param {ArrayBuffer} arrayBuffer The Array Buffer.
   * @param {string} opt_pathToBitJS Optional string for where the BitJS files are located.
   */
  constructor(arrayBuffer, opt_pathToBitJS) {
    /**
     * The ArrayBuffer object.
     * @type {ArrayBuffer}
     * @protected
     */
    this.ab = arrayBuffer;

    /**
     * The path to the BitJS files.
     * @type {string}
     * @private
     */
    this.pathToBitJS_ = opt_pathToBitJS || '/';

    /**
     * A map from event type to an array of listeners.
     * @type {Map.<string, Array>}
     */
    this.listeners_ = {};
    for (let type in bitjs.archive.UnarchiveEvent.Type) {
      this.listeners_[bitjs.archive.UnarchiveEvent.Type[type]] = [];
    }

    /**
     * Private web worker initialized during start().
     * @type {Worker}
     * @private
     */
    this.worker_ = null;
  }

  /**
   * This method must be overridden by the subclass to return the script filename.
   * @return {string} The script filename.
   * @protected.
   */
  getScriptFileName() {
    throw 'Subclasses of AbstractUnarchiver must overload getScriptFileName()';
  }

  /**
   * Adds an event listener for UnarchiveEvents.
   *
   * @param {string} Event type.
   * @param {function} An event handler function.
   */
  addEventListener(type, listener) {
    if (type in this.listeners_) {
      if (this.listeners_[type].indexOf(listener) == -1) {
        this.listeners_[type].push(listener);
      }
    }
  }

  /**
   * Removes an event listener.
   *
   * @param {string} Event type.
   * @param {EventListener|function} An event listener or handler function.
   */
  removeEventListener(type, listener) {
    if (type in this.listeners_) {
      const index = this.listeners_[type].indexOf(listener);
      if (index != -1) {
        this.listeners_[type].splice(index, 1);
      }
    }
  }

  /**
   * Receive an event and pass it to the listener functions.
   *
   * @param {bitjs.archive.UnarchiveEvent} e
   * @private
   */
  handleWorkerEvent_(e) {
    if ((e instanceof bitjs.archive.UnarchiveEvent || e.type) &&
        this.listeners_[e.type] instanceof Array) {
      this.listeners_[e.type].forEach(function (listener) { listener(e) });
      if (e.type == bitjs.archive.UnarchiveEvent.Type.FINISH) {
          this.worker_.terminate();
      }
    } else {
      console.log(e);
    }
  }

  /**
   * Starts the unarchive in a separate Web Worker thread and returns immediately.
   */
  start() {
    const me = this;
    const scriptFileName = this.pathToBitJS_ + this.getScriptFileName();
    if (scriptFileName) {
      this.worker_ = new Worker(scriptFileName);

      this.worker_.onerror = function(e) {
        console.log('Worker error: message = ' + e.message);
        throw e;
      };

      this.worker_.onmessage = function(e) {
        if (typeof e.data == 'string') {
          // Just log any strings the workers pump our way.
          console.log(e.data);
        } else {
          // Assume that it is an UnarchiveEvent.  Some browsers preserve the 'type'
          // so that instanceof UnarchiveEvent returns true, but others do not.
          me.handleWorkerEvent_(e.data);
        }
      };

      this.worker_.postMessage({file: this.ab});
    }
  }

  /**
   * Terminates the Web Worker for this Unarchiver and returns immediately.
   */
  stop() {
    if (this.worker_) {
      this.worker_.terminate();
    }
  }
}


/**
 * Unzipper
 */
bitjs.archive.Unzipper = class extends bitjs.archive.Unarchiver {
  constructor(arrayBuffer, opt_pathToBitJS) {
    super(arrayBuffer, opt_pathToBitJS);
  }

  getScriptFileName() { return 'archive/unzip.js'; }
}


/**
 * Unrarrer
 */
bitjs.archive.Unrarrer = class extends bitjs.archive.Unarchiver {
  constructor(arrayBuffer, opt_pathToBitJS) {
    super(arrayBuffer, opt_pathToBitJS);
  }

  getScriptFileName() { return 'archive/unrar.js'; }
}

/**
 * Untarrer
 * @extends {bitjs.archive.Unarchiver}
 * @constructor
 */
bitjs.archive.Untarrer = class extends bitjs.archive.Unarchiver {
  constructor(arrayBuffer, opt_pathToBitJS) {
    super(arrayBuffer, opt_pathToBitJS);
  }

  getScriptFileName() { return 'archive/untar.js'; };
}

/**
 * Factory method that creates an unarchiver based on the byte signature found
 * in the arrayBuffer.
 * @param {ArrayBuffer} ab
 * @param {string=} opt_pathToBitJS Path to the unarchiver script files.
 * @return {bitjs.archive.Unarchiver}
 */
bitjs.archive.GetUnarchiver = function(ab, opt_pathToBitJS) {
  let unarchiver = null;
  const pathToBitJS = opt_pathToBitJS || '';
  const h = new Uint8Array(ab, 0, 10);

  if (h[0] == 0x52 && h[1] == 0x61 && h[2] == 0x72 && h[3] == 0x21) { // Rar!
    unarchiver = new bitjs.archive.Unrarrer(ab, pathToBitJS);
  } else if (h[0] == 0x50 && h[1] == 0x4B) { // PK (Zip)
    unarchiver = new bitjs.archive.Unzipper(ab, pathToBitJS);
  } else { // Try with tar
    unarchiver = new bitjs.archive.Untarrer(ab, pathToBitJS);
  }
  return unarchiver;
};

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

const zLocalFileHeaderSignature = 0x04034b50;
const zArchiveExtraDataSignature = 0x08064b50;
const zCentralFileHeaderSignature = 0x02014b50;
const zDigitalSignatureSignature = 0x05054b50;
const zEndOfCentralDirSignature = 0x06064b50;
const zEndOfCentralDirLocatorSignature = 0x07064b50;

// mask for getting the Nth bit (zero-based)
const BIT = [ 0x01, 0x02, 0x04, 0x08,
    0x10, 0x20, 0x40, 0x80,
    0x100, 0x200, 0x400, 0x800,
    0x1000, 0x2000, 0x4000, 0x8000];


class ZipLocalFile {
  // takes a ByteStream and parses out the local file information
  constructor(bstream) {
    if (typeof bstream != typeof {} || !bstream.readNumber || typeof bstream.readNumber != typeof function(){}) {
      return null;
    }

    bstream.readNumber(4); // swallow signature
    this.version = bstream.readNumber(2);
    this.generalPurpose = bstream.readNumber(2);
    this.compressionMethod = bstream.readNumber(2);
    this.lastModFileTime = bstream.readNumber(2);
    this.lastModFileDate = bstream.readNumber(2);
    this.crc32 = bstream.readNumber(4);
    this.compressedSize = bstream.readNumber(4);
    this.uncompressedSize = bstream.readNumber(4);
    this.fileNameLength = bstream.readNumber(2);
    this.extraFieldLength = bstream.readNumber(2);

    this.filename = null;
    if (this.fileNameLength > 0) {
      this.filename = bstream.readString(this.fileNameLength);
    }

    info("Zip Local File Header:");
    info(" version=" + this.version);
    info(" general purpose=" + this.generalPurpose);
    info(" compression method=" + this.compressionMethod);
    info(" last mod file time=" + this.lastModFileTime);
    info(" last mod file date=" + this.lastModFileDate);
    info(" crc32=" + this.crc32);
    info(" compressed size=" + this.compressedSize);
    info(" uncompressed size=" + this.uncompressedSize);
    info(" file name length=" + this.fileNameLength);
    info(" extra field length=" + this.extraFieldLength);
    info(" filename = '" + this.filename + "'");

    this.extraField = null;
    if (this.extraFieldLength > 0) {
      this.extraField = bstream.readString(this.extraFieldLength);
      info(" extra field=" + this.extraField);
    }

    // read in the compressed data
    this.fileData = null;
    if (this.compressedSize > 0) {
      this.fileData = new Uint8Array(bstream.readBytes(this.compressedSize));
    }

    // TODO: deal with data descriptor if present (we currently assume no data descriptor!)
    // "This descriptor exists only if bit 3 of the general purpose bit flag is set"
    // But how do you figure out how big the file data is if you don't know the compressedSize
    // from the header?!?
    if ((this.generalPurpose & BIT[3]) != 0) {
      this.crc32 = bstream.readNumber(4);
      this.compressedSize = bstream.readNumber(4);
      this.uncompressedSize = bstream.readNumber(4);
    }
  }

  // determine what kind of compressed data we have and decompress
  unzip() {
    // Zip Version 1.0, no compression (store only)
    if (this.compressionMethod == 0 ) {
      info("ZIP v"+this.version+", store only: " + this.filename + " (" + this.compressedSize + " bytes)");
      currentBytesUnarchivedInFile = this.compressedSize;
      currentBytesUnarchived += this.compressedSize;
    }
    // version == 20, compression method == 8 (DEFLATE)
    else if (this.compressionMethod == 8) {
      info("ZIP v2.0, DEFLATE: " + this.filename + " (" + this.compressedSize + " bytes)");
      this.fileData = inflate(this.fileData, this.uncompressedSize);
    }
    else {
      err("UNSUPPORTED VERSION/FORMAT: ZIP v" + this.version + ", compression method=" + this.compressionMethod + ": " + this.filename + " (" + this.compressedSize + " bytes)");
      this.fileData = null;
    }
  }
}

// Takes an ArrayBuffer of a zip file in
// returns null on error
// returns an array of DecompressedFile objects on success
const unzip = function(arrayBuffer) {
  postMessage(new bitjs.archive.UnarchiveStartEvent());

  currentFilename = "";
  currentFileNumber = 0;
  currentBytesUnarchivedInFile = 0;
  currentBytesUnarchived = 0;
  totalUncompressedBytesInArchive = 0;
  totalFilesInArchive = 0;
  currentBytesUnarchived = 0;

  const bstream = new bitjs.io.ByteStream(arrayBuffer);
  // detect local file header signature or return null
  if (bstream.peekNumber(4) == zLocalFileHeaderSignature) {
    const localFiles = [];
    // loop until we don't see any more local files
    while (bstream.peekNumber(4) == zLocalFileHeaderSignature) {
      const oneLocalFile = new ZipLocalFile(bstream);
      // this should strip out directories/folders
      if (oneLocalFile && oneLocalFile.uncompressedSize > 0 && oneLocalFile.fileData) {
        localFiles.push(oneLocalFile);
        totalUncompressedBytesInArchive += oneLocalFile.uncompressedSize;
      }
    }
    totalFilesInArchive = localFiles.length;

    // got all local files, now sort them
    localFiles.sort((a,b) => a.filename > b.filename ? 1 : -1);

    // archive extra data record
    if (bstream.peekNumber(4) == zArchiveExtraDataSignature) {
      info(" Found an Archive Extra Data Signature");

      // skipping this record for now
      bstream.readNumber(4);
      const archiveExtraFieldLength = bstream.readNumber(4);
      bstream.readString(archiveExtraFieldLength);
    }

    // central directory structure
    // TODO: handle the rest of the structures (Zip64 stuff)
    if (bstream.peekNumber(4) == zCentralFileHeaderSignature) {
      info(" Found a Central File Header");

      // read all file headers
      while (bstream.peekNumber(4) == zCentralFileHeaderSignature) {
        bstream.readNumber(4); // signature
        bstream.readNumber(2); // version made by
        bstream.readNumber(2); // version needed to extract
        bstream.readNumber(2); // general purpose bit flag
        bstream.readNumber(2); // compression method
        bstream.readNumber(2); // last mod file time
        bstream.readNumber(2); // last mod file date
        bstream.readNumber(4); // crc32
        bstream.readNumber(4); // compressed size
        bstream.readNumber(4); // uncompressed size
        const fileNameLength = bstream.readNumber(2); // file name length
        const extraFieldLength = bstream.readNumber(2); // extra field length
        const fileCommentLength = bstream.readNumber(2); // file comment length
        bstream.readNumber(2); // disk number start
        bstream.readNumber(2); // internal file attributes
        bstream.readNumber(4); // external file attributes
        bstream.readNumber(4); // relative offset of local header

        bstream.readString(fileNameLength); // file name
        bstream.readString(extraFieldLength); // extra field
        bstream.readString(fileCommentLength); // file comment
      }
    }

    // digital signature
    if (bstream.peekNumber(4) == zDigitalSignatureSignature) {
      info(" Found a Digital Signature");

      bstream.readNumber(4);
      const sizeOfSignature = bstream.readNumber(2);
      bstream.readString(sizeOfSignature); // digital signature data
    }

    // report # files and total length
    if (localFiles.length > 0) {
      postProgress();
    }

    // now do the unzipping of each file
    for (let i = 0; i < localFiles.length; ++i) {
      const localfile = localFiles[i];

      // update progress
      currentFilename = localfile.filename;
      currentFileNumber = i;
      currentBytesUnarchivedInFile = 0;

      // actually do the unzipping
      localfile.unzip();

      if (localfile.fileData != null) {
        postMessage(new bitjs.archive.UnarchiveExtractEvent(localfile));
        postProgress();
      }
    }
    postProgress();
    postMessage(new bitjs.archive.UnarchiveFinishEvent());
  }
}

// returns a table of Huffman codes 
// each entry's index is its code and its value is a JavaScript object 
// containing {length: 6, symbol: X}
function getHuffmanCodes(bitLengths) {
  // ensure bitLengths is an array containing at least one element
  if (typeof bitLengths != typeof [] || bitLengths.length < 1) {
    err("Error! getHuffmanCodes() called with an invalid array");
    return null;
  }

  // Reference: http://tools.ietf.org/html/rfc1951#page-8
  const numLengths = bitLengths.length;
  const bl_count = [];
  let MAX_BITS = 1;

  // Step 1: count up how many codes of each length we have
  for (let i = 0; i < numLengths; ++i) {
    const length = bitLengths[i];
    // test to ensure each bit length is a positive, non-zero number
    if (typeof length != typeof 1 || length < 0) {
      err("bitLengths contained an invalid number in getHuffmanCodes(): " + length + " of type " + (typeof length));
      return null;
    }
    // increment the appropriate bitlength count
    if (bl_count[length] == undefined) bl_count[length] = 0;
    // a length of zero means this symbol is not participating in the huffman coding
    if (length > 0) bl_count[length]++;
    if (length > MAX_BITS) MAX_BITS = length;
  }

  // Step 2: Find the numerical value of the smallest code for each code length
  const next_code = [];
  let code = 0;
  for (let bits = 1; bits <= MAX_BITS; ++bits) {
    const length = bits-1;
    // ensure undefined lengths are zero
    if (bl_count[length] == undefined) bl_count[length] = 0;
    code = (code + bl_count[bits-1]) << 1;
    next_code[bits] = code;
  }

  // Step 3: Assign numerical values to all codes
  const table = {};
  let tableLength = 0;
  for (let n = 0; n < numLengths; ++n) {
    const len = bitLengths[n];
    if (len != 0) {
      table[next_code[len]] = { length: len, symbol: n }; //, bitstring: binaryValueToString(next_code[len],len) };
      tableLength++;
      next_code[len]++;
    }
  }
  table.maxLength = tableLength;

  return table;
}

/*
     The Huffman codes for the two alphabets are fixed, and are not
     represented explicitly in the data.  The Huffman code lengths
     for the literal/length alphabet are:

               Lit Value    Bits        Codes
               ---------    ----        -----
                 0 - 143     8          00110000 through
                                        10111111
               144 - 255     9          110010000 through
                                        111111111
               256 - 279     7          0000000 through
                                        0010111
               280 - 287     8          11000000 through
                                        11000111
*/
// fixed Huffman codes go from 7-9 bits, so we need an array whose index can hold up to 9 bits
let fixedHCtoLiteral = null;
let fixedHCtoDistance = null;
function getFixedLiteralTable() {
    // create once
    if (!fixedHCtoLiteral) {
        const bitlengths = new Array(288);
        for (let i = 0; i <= 143; ++i) bitlengths[i] = 8;
        for (let i = 144; i <= 255; ++i) bitlengths[i] = 9;
        for (let i = 256; i <= 279; ++i) bitlengths[i] = 7;
        for (let i = 280; i <= 287; ++i) bitlengths[i] = 8;

        // get huffman code table
        fixedHCtoLiteral = getHuffmanCodes(bitlengths);
    }
    return fixedHCtoLiteral;
}

function getFixedDistanceTable() {
  // create once
  if (!fixedHCtoDistance) {
    const bitlengths = new Array(32);
    for (let i = 0; i < 32; ++i) { bitlengths[i] = 5; }

    // get huffman code table
    fixedHCtoDistance = getHuffmanCodes(bitlengths);
  }
  return fixedHCtoDistance;
}

// extract one bit at a time until we find a matching Huffman Code
// then return that symbol
function decodeSymbol(bstream, hcTable) {
  let code = 0;
  let len = 0;
  let match = false;

  // loop until we match
  for (;;) {
    // read in next bit
    const bit = bstream.readBits(1);
    code = (code<<1) | bit;
    ++len;

    // check against Huffman Code table and break if found
    if (hcTable.hasOwnProperty(code) && hcTable[code].length == len) {
      break;
    }
    if (len > hcTable.maxLength) {
      err("Bit stream out of sync, didn't find a Huffman Code, length was " + len +
          " and table only max code length of " + hcTable.maxLength);
      break;
    }
  }
  return hcTable[code].symbol;
}


const CodeLengthCodeOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

/*
     Extra               Extra               Extra
Code Bits Length(s) Code Bits Lengths   Code Bits Length(s)
---- ---- ------     ---- ---- -------   ---- ---- -------
 257   0     3       267   1   15,16     277   4   67-82
 258   0     4       268   1   17,18     278   4   83-98
 259   0     5       269   2   19-22     279   4   99-114
 260   0     6       270   2   23-26     280   4  115-130
 261   0     7       271   2   27-30     281   5  131-162
 262   0     8       272   2   31-34     282   5  163-194
 263   0     9       273   3   35-42     283   5  195-226
 264   0    10       274   3   43-50     284   5  227-257
 265   1  11,12      275   3   51-58     285   0    258
 266   1  13,14      276   3   59-66
*/
const LengthLookupTable = [
    [0,3], [0,4], [0,5], [0,6],
    [0,7], [0,8], [0,9], [0,10],
    [1,11], [1,13], [1,15], [1,17],
    [2,19], [2,23], [2,27], [2,31],
    [3,35], [3,43], [3,51], [3,59],
    [4,67], [4,83], [4,99], [4,115],
    [5,131], [5,163], [5,195], [5,227],
    [0,258]
];

/*
      Extra           Extra                Extra
 Code Bits Dist  Code Bits   Dist     Code Bits Distance
 ---- ---- ----  ---- ----  ------    ---- ---- --------
   0   0    1     10   4     33-48    20    9   1025-1536
   1   0    2     11   4     49-64    21    9   1537-2048
   2   0    3     12   5     65-96    22   10   2049-3072
   3   0    4     13   5     97-128   23   10   3073-4096
   4   1   5,6    14   6    129-192   24   11   4097-6144
   5   1   7,8    15   6    193-256   25   11   6145-8192
   6   2   9-12   16   7    257-384   26   12  8193-12288
   7   2  13-16   17   7    385-512   27   12 12289-16384
   8   3  17-24   18   8    513-768   28   13 16385-24576
   9   3  25-32   19   8   769-1024   29   13 24577-32768
*/
const DistLookupTable = [
    [0,1], [0,2], [0,3], [0,4],
    [1,5], [1,7],
    [2,9], [2,13],
    [3,17], [3,25],
    [4,33], [4,49],
    [5,65], [5,97],
    [6,129], [6,193],
    [7,257], [7,385],
    [8,513], [8,769],
    [9,1025], [9,1537],
    [10,2049], [10,3073],
    [11,4097], [11,6145],
    [12,8193], [12,12289],
    [13,16385], [13,24577]
];

function inflateBlockData(bstream, hcLiteralTable, hcDistanceTable, buffer) {
  /*
      loop (until end of block code recognized)
         decode literal/length value from input stream
         if value < 256
            copy value (literal byte) to output stream
         otherwise
            if value = end of block (256)
               break from loop
            otherwise (value = 257..285)
               decode distance from input stream

               move backwards distance bytes in the output
               stream, and copy length bytes from this
               position to the output stream.
  */
  let numSymbols = 0;
  let blockSize = 0;
  for (;;) {
    const symbol = decodeSymbol(bstream, hcLiteralTable);
    ++numSymbols;
    if (symbol < 256) {
      // copy literal byte to output
      buffer.insertByte(symbol);
      blockSize++;
    } else {
      // end of block reached
      if (symbol == 256) {
        break;
      } else {
        const lengthLookup = LengthLookupTable[symbol - 257];
        let length = lengthLookup[1] + bstream.readBits(lengthLookup[0]);
        const distLookup = DistLookupTable[decodeSymbol(bstream, hcDistanceTable)];
        let distance = distLookup[1] + bstream.readBits(distLookup[0]);

        // now apply length and distance appropriately and copy to output

        // TODO: check that backward distance < data.length?

        // http://tools.ietf.org/html/rfc1951#page-11
        // "Note also that the referenced string may overlap the current
        //  position; for example, if the last 2 bytes decoded have values
        //  X and Y, a string reference with <length = 5, distance = 2>
        //  adds X,Y,X,Y,X to the output stream."
        //
        // loop for each character
        let ch = buffer.ptr - distance;
        blockSize += length;
        if(length > distance) {
          const data = buffer.data;
          while (length--) {
            buffer.insertByte(data[ch++]);
          }
        } else {
          buffer.insertBytes(buffer.data.subarray(ch, ch + length))
        }
      } // length-distance pair
    } // length-distance pair or end-of-block
  } // loop until we reach end of block
  return blockSize;
}

// {Uint8Array} compressedData A Uint8Array of the compressed file data.
// compression method 8
// deflate: http://tools.ietf.org/html/rfc1951
function inflate(compressedData, numDecompressedBytes) {
  // Bit stream representing the compressed data.
  const bstream = new bitjs.io.BitStream(compressedData.buffer,
      false /* rtl */,
      compressedData.byteOffset,
      compressedData.byteLength);
  const buffer = new bitjs.io.ByteBuffer(numDecompressedBytes);
  let numBlocks = 0;
  let blockSize = 0;

  // block format: http://tools.ietf.org/html/rfc1951#page-9
  let bFinal = 0;
  do {
    bFinal = bstream.readBits(1);
    let bType = bstream.readBits(2);
    blockSize = 0;
    ++numBlocks;
    // no compression
    if (bType == 0) {
      // skip remaining bits in this byte
      while (bstream.bitPtr != 0) bstream.readBits(1);
      const len = bstream.readBits(16);
      const nlen = bstream.readBits(16);
      // TODO: check if nlen is the ones-complement of len?
      if (len > 0) buffer.insertBytes(bstream.readBytes(len));
      blockSize = len;
    }
    // fixed Huffman codes
    else if(bType == 1) {
      blockSize = inflateBlockData(bstream, getFixedLiteralTable(), getFixedDistanceTable(), buffer);
    }
    // dynamic Huffman codes
    else if(bType == 2) {
      const numLiteralLengthCodes = bstream.readBits(5) + 257;
      const numDistanceCodes = bstream.readBits(5) + 1;
      const numCodeLengthCodes = bstream.readBits(4) + 4;

      // populate the array of code length codes (first de-compaction)
      const codeLengthsCodeLengths = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
      for (let i = 0; i < numCodeLengthCodes; ++i) {
        codeLengthsCodeLengths[ CodeLengthCodeOrder[i] ] = bstream.readBits(3);
      }

      // get the Huffman Codes for the code lengths
      const codeLengthsCodes = getHuffmanCodes(codeLengthsCodeLengths);

      // now follow this mapping
      /*
        0 - 15: Represent code lengths of 0 - 15
            16: Copy the previous code length 3 - 6 times.
                The next 2 bits indicate repeat length
                (0 = 3, ... , 3 = 6)
                Example:  Codes 8, 16 (+2 bits 11),
                          16 (+2 bits 10) will expand to
                          12 code lengths of 8 (1 + 6 + 5)
            17: Repeat a code length of 0 for 3 - 10 times.
                (3 bits of length)
            18: Repeat a code length of 0 for 11 - 138 times
                (7 bits of length)
      */
      // to generate the true code lengths of the Huffman Codes for the literal
      // and distance tables together
      const literalCodeLengths = [];
      let prevCodeLength = 0;
      while (literalCodeLengths.length < numLiteralLengthCodes + numDistanceCodes) {
        const symbol = decodeSymbol(bstream, codeLengthsCodes);
        if (symbol <= 15) {
          literalCodeLengths.push(symbol);
          prevCodeLength = symbol;
        } else if (symbol == 16) {
          let repeat = bstream.readBits(2) + 3;
          while (repeat--) {
            literalCodeLengths.push(prevCodeLength);
          }
        } else if (symbol == 17) {
          let repeat = bstream.readBits(3) + 3;
          while (repeat--) {
            literalCodeLengths.push(0);
          }
        } else if (symbol == 18) {
          let repeat = bstream.readBits(7) + 11;
          while (repeat--) {
            literalCodeLengths.push(0);
          }
        }
      }

      // now split the distance code lengths out of the literal code array
      const distanceCodeLengths = literalCodeLengths.splice(numLiteralLengthCodes, numDistanceCodes);

      // now generate the true Huffman Code tables using these code lengths
      const hcLiteralTable = getHuffmanCodes(literalCodeLengths);
      const hcDistanceTable = getHuffmanCodes(distanceCodeLengths);
      blockSize = inflateBlockData(bstream, hcLiteralTable, hcDistanceTable, buffer);
    } else { // error
      err("Error! Encountered deflate block of type 3");
      return null;
    }

    // update progress
    currentBytesUnarchivedInFile += blockSize;
    currentBytesUnarchived += blockSize;
    postProgress();
  } while (bFinal != 1);
  // we are done reading blocks if the bFinal bit was set for this block

  // return the buffer data bytes
  return buffer.data;
}

// event.data.file has the ArrayBuffer.
onmessage = function(event) {
  unzip(event.data.file, true);
};
