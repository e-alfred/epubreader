/**
 * unrar.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 * Copyright(c) 2011 antimatter15
 */

// This file expects to be invoked as a Worker (see onmessage below).
//importScripts('../io/bitstream.js');

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

//importScripts('archive.js');

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

//importScripts('rarvm.js');

/**
 * rarvm.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2017 Google Inc.
 */

/**
 * CRC Implementation.
 */
const CRCTab = new Array(256).fill(0);

// Helper functions between signed and unsigned integers.

/**
 * -1 becomes 0xffffffff
 */
function fromSigned32ToUnsigned32(val) {
  return (val < 0) ? (val += 0x100000000) : val;
}

/**
 * 0xffffffff becomes -1
 */
function fromUnsigned32ToSigned32(val) {
  return (val >= 0x80000000) ? (val -= 0x100000000) : val;
}

/**
 * -1 becomes 0xff
 */
function fromSigned8ToUnsigned8(val) {
  return (val < 0) ? (val += 0x100) : val;
}

/**
 * 0xff becomes -1
 */
function fromUnsigned8ToSigned8(val) {
  return (val >= 0x80) ? (val -= 0x100) : val;
}

function InitCRC() {
  for (let i = 0; i < 256; ++i) {
    let c = i;
    for (let j = 0; j < 8; ++j) {
      // Read http://stackoverflow.com/questions/6798111/bitwise-operations-on-32-bit-unsigned-ints
      // for the bitwise operator issue (JS interprets operands as 32-bit signed
      // integers and we need to deal with unsigned ones here).
      c = ((c & 1) ? ((c >>> 1) ^ 0xEDB88320) : (c >>> 1)) >>> 0;
    }
    CRCTab[i] = c;
  }
}

/**
 * @param {number} startCRC
 * @param {Uint8Array} arr
 * @return {number}
 */
function CRC(startCRC, arr) {
  if (CRCTab[1] == 0) {
    InitCRC();
  }

/*
#if defined(LITTLE_ENDIAN) && defined(PRESENT_INT32) && defined(ALLOW_NOT_ALIGNED_INT)
  while (Size>0 && ((long)Data & 7))
  {
    StartCRC=CRCTab[(byte)(StartCRC^Data[0])]^(StartCRC>>8);
    Size--;
    Data++;
  }
  while (Size>=8)
  {
    StartCRC^=*(uint32 *)Data;
    StartCRC=CRCTab[(byte)StartCRC]^(StartCRC>>8);
    StartCRC=CRCTab[(byte)StartCRC]^(StartCRC>>8);
    StartCRC=CRCTab[(byte)StartCRC]^(StartCRC>>8);
    StartCRC=CRCTab[(byte)StartCRC]^(StartCRC>>8);
    StartCRC^=*(uint32 *)(Data+4);
    StartCRC=CRCTab[(byte)StartCRC]^(StartCRC>>8);
    StartCRC=CRCTab[(byte)StartCRC]^(StartCRC>>8);
    StartCRC=CRCTab[(byte)StartCRC]^(StartCRC>>8);
    StartCRC=CRCTab[(byte)StartCRC]^(StartCRC>>8);
    Data+=8;
    Size-=8;
  }
#endif
*/

  for (let i = 0; i < arr.length; ++i) {
    const byte = ((startCRC ^ arr[i]) >>> 0) & 0xff;
    startCRC = (CRCTab[byte] ^ (startCRC >>> 8)) >>> 0;
  }

  return startCRC;
}

// ============================================================================================== //


/**
 * RarVM Implementation.
 */
const VM_MEMSIZE = 0x40000;
const VM_MEMMASK = (VM_MEMSIZE - 1);
const VM_GLOBALMEMADDR = 0x3C000;
const VM_GLOBALMEMSIZE = 0x2000;
const VM_FIXEDGLOBALSIZE = 64;
const MAXWINSIZE = 0x400000;
const MAXWINMASK = (MAXWINSIZE - 1);

/**
 */
const VM_Commands = {
  VM_MOV: 0,
  VM_CMP: 1,
  VM_ADD: 2,
  VM_SUB: 3,
  VM_JZ: 4,
  VM_JNZ: 5,
  VM_INC: 6,
  VM_DEC: 7,
  VM_JMP: 8,
  VM_XOR: 9,
  VM_AND: 10,
  VM_OR: 11,
  VM_TEST: 12,
  VM_JS: 13,
  VM_JNS: 14,
  VM_JB: 15,
  VM_JBE: 16,
  VM_JA: 17,
  VM_JAE: 18,
  VM_PUSH: 19,
  VM_POP: 20,
  VM_CALL: 21,
  VM_RET: 22,
  VM_NOT: 23,
  VM_SHL: 24,
  VM_SHR: 25,
  VM_SAR: 26,
  VM_NEG: 27,
  VM_PUSHA: 28,
  VM_POPA: 29,
  VM_PUSHF: 30,
  VM_POPF: 31,
  VM_MOVZX: 32,
  VM_MOVSX: 33,
  VM_XCHG: 34,
  VM_MUL: 35,
  VM_DIV: 36,
  VM_ADC: 37,
  VM_SBB: 38,
  VM_PRINT: 39,

/*
#ifdef VM_OPTIMIZE
  VM_MOVB, VM_MOVD, VM_CMPB, VM_CMPD,

  VM_ADDB, VM_ADDD, VM_SUBB, VM_SUBD, VM_INCB, VM_INCD, VM_DECB, VM_DECD,
  VM_NEGB, VM_NEGD,
#endif
*/

  // TODO: This enum value would be much larger if VM_OPTIMIZE.
  VM_STANDARD: 40,
};

/**
 */
const VM_StandardFilters = {
  VMSF_NONE: 0,
  VMSF_E8: 1,
  VMSF_E8E9: 2,
  VMSF_ITANIUM: 3,
  VMSF_RGB: 4,
  VMSF_AUDIO: 5,
  VMSF_DELTA: 6,
  VMSF_UPCASE: 7,
};

/**
 */
const VM_Flags = {
  VM_FC: 1,
  VM_FZ: 2,
  VM_FS: 0x80000000,
};

/**
 */
const VM_OpType = {
  VM_OPREG: 0,
  VM_OPINT: 1,
  VM_OPREGMEM: 2,
  VM_OPNONE: 3,
};

/**
 * Finds the key that maps to a given value in an object.  This function is useful in debugging
 * variables that use the above enums.
 * @param {Object} obj
 * @param {number} val
 * @return {string} The key/enum value as a string.
 */
function findKeyForValue(obj, val) {
  for (let key in obj) {
    if (obj[key] === val) {
      return key;
    }
  }
  return null;
}

function getDebugString(obj, val) {
  let s = 'Unknown.';
  if (obj === VM_Commands) {
    s = 'VM_Commands.';
  } else if (obj === VM_StandardFilters) {
    s = 'VM_StandardFilters.';
  } else if (obj === VM_Flags) {
    s = 'VM_OpType.';
  } else if (obj === VM_OpType) {
    s = 'VM_OpType.';
  }

  return s + findKeyForValue(obj, val);
}

/**
 */
class VM_PreparedOperand {
  constructor() {
    /** @type {VM_OpType} */
    this.Type;

    /** @type {number} */
    this.Data = 0;

    /** @type {number} */
    this.Base = 0;

    // TODO: In C++ this is a uint*
    /** @type {Array<number>} */
    this.Addr = null;
  };

  /** @return {string} */
  toString() {
    if (this.Type === null) {
      return 'Error: Type was null in VM_PreparedOperand';
    }
    return '{ '
        + 'Type: ' + getDebugString(VM_OpType, this.Type)
        + ', Data: ' + this.Data
        + ', Base: ' + this.Base
        + ' }';
  }
}

/**
 */
class VM_PreparedCommand {
  constructor() {
    /** @type {VM_Commands} */
    this.OpCode;

    /** @type {boolean} */
    this.ByteMode = false;

    /** @type {VM_PreparedOperand} */
    this.Op1 = new VM_PreparedOperand();

    /** @type {VM_PreparedOperand} */
    this.Op2 = new VM_PreparedOperand();
  }

  /** @return {string} */
  toString(indent) {
    if (this.OpCode === null) {
      return 'Error: OpCode was null in VM_PreparedCommand';
    }
    indent = indent || '';
    return indent + '{\n'
        + indent + '  OpCode: ' + getDebugString(VM_Commands, this.OpCode) + ',\n'
        + indent + '  ByteMode: ' + this.ByteMode + ',\n'
        + indent + '  Op1: ' + this.Op1.toString() + ',\n'
        + indent + '  Op2: ' + this.Op2.toString() + ',\n'
        + indent + '}';
  }
}

/**
 */
class VM_PreparedProgram {
  constructor() {
    /** @type {Array<VM_PreparedCommand>} */
    this.Cmd = [];

    /** @type {Array<VM_PreparedCommand>} */
    this.AltCmd = null;

    /** @type {Uint8Array} */
    this.GlobalData = new Uint8Array();

    /** @type {Uint8Array} */
    this.StaticData = new Uint8Array(); // static data contained in DB operators

    /** @type {Uint32Array} */
    this.InitR = new Uint32Array(7);

    /**
     * A pointer to bytes that have been filtered by a program.
     * @type {Uint8Array}
     */
    this.FilteredData = null;
  }

  /** @return {string} */
  toString() {
    let s = '{\n  Cmd: [\n';
    for (let i = 0; i < this.Cmd.length; ++i) {
      s += this.Cmd[i].toString('  ') + ',\n';
    }
    s += '],\n';
    // TODO: Dump GlobalData, StaticData, InitR?
    s += ' }\n';
    return s;
  }
}

/**
 */
class UnpackFilter {
  constructor() {
    /** @type {number} */
    this.BlockStart = 0;

    /** @type {number} */
    this.BlockLength = 0;

    /** @type {number} */
    this.ExecCount = 0;

    /** @type {boolean} */
    this.NextWindow = false;

    // position of parent filter in Filters array used as prototype for filter
    // in PrgStack array. Not defined for filters in Filters array.
    /** @type {number} */
    this.ParentFilter = null;

    /** @type {VM_PreparedProgram} */
    this.Prg = new VM_PreparedProgram();
  }
}

const VMCF_OP0       =  0;
const VMCF_OP1       =  1;
const VMCF_OP2       =  2;
const VMCF_OPMASK    =  3;
const VMCF_BYTEMODE  =  4;
const VMCF_JUMP      =  8;
const VMCF_PROC      = 16;
const VMCF_USEFLAGS  = 32;
const VMCF_CHFLAGS   = 64;

const VM_CmdFlags = [
  /* VM_MOV   */ VMCF_OP2 | VMCF_BYTEMODE                                ,
  /* VM_CMP   */ VMCF_OP2 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_ADD   */ VMCF_OP2 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_SUB   */ VMCF_OP2 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_JZ    */ VMCF_OP1 | VMCF_JUMP | VMCF_USEFLAGS                    ,
  /* VM_JNZ   */ VMCF_OP1 | VMCF_JUMP | VMCF_USEFLAGS                    ,
  /* VM_INC   */ VMCF_OP1 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_DEC   */ VMCF_OP1 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_JMP   */ VMCF_OP1 | VMCF_JUMP                                    ,
  /* VM_XOR   */ VMCF_OP2 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_AND   */ VMCF_OP2 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_OR    */ VMCF_OP2 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_TEST  */ VMCF_OP2 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_JS    */ VMCF_OP1 | VMCF_JUMP | VMCF_USEFLAGS                    ,
  /* VM_JNS   */ VMCF_OP1 | VMCF_JUMP | VMCF_USEFLAGS                    ,
  /* VM_JB    */ VMCF_OP1 | VMCF_JUMP | VMCF_USEFLAGS                    ,
  /* VM_JBE   */ VMCF_OP1 | VMCF_JUMP | VMCF_USEFLAGS                    ,
  /* VM_JA    */ VMCF_OP1 | VMCF_JUMP | VMCF_USEFLAGS                    ,
  /* VM_JAE   */ VMCF_OP1 | VMCF_JUMP | VMCF_USEFLAGS                    ,
  /* VM_PUSH  */ VMCF_OP1                                                ,
  /* VM_POP   */ VMCF_OP1                                                ,
  /* VM_CALL  */ VMCF_OP1 | VMCF_PROC                                    ,
  /* VM_RET   */ VMCF_OP0 | VMCF_PROC                                    ,
  /* VM_NOT   */ VMCF_OP1 | VMCF_BYTEMODE                                ,
  /* VM_SHL   */ VMCF_OP2 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_SHR   */ VMCF_OP2 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_SAR   */ VMCF_OP2 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_NEG   */ VMCF_OP1 | VMCF_BYTEMODE | VMCF_CHFLAGS                 ,
  /* VM_PUSHA */ VMCF_OP0                                                ,
  /* VM_POPA  */ VMCF_OP0                                                ,
  /* VM_PUSHF */ VMCF_OP0 | VMCF_USEFLAGS                                ,
  /* VM_POPF  */ VMCF_OP0 | VMCF_CHFLAGS                                 ,
  /* VM_MOVZX */ VMCF_OP2                                                ,
  /* VM_MOVSX */ VMCF_OP2                                                ,
  /* VM_XCHG  */ VMCF_OP2 | VMCF_BYTEMODE                                ,
  /* VM_MUL   */ VMCF_OP2 | VMCF_BYTEMODE                                ,
  /* VM_DIV   */ VMCF_OP2 | VMCF_BYTEMODE                                ,
  /* VM_ADC   */ VMCF_OP2 | VMCF_BYTEMODE | VMCF_USEFLAGS | VMCF_CHFLAGS ,
  /* VM_SBB   */ VMCF_OP2 | VMCF_BYTEMODE | VMCF_USEFLAGS | VMCF_CHFLAGS ,
  /* VM_PRINT */ VMCF_OP0                                                ,
];


/**
 */
class StandardFilterSignature {
  /**
   * @param {number} length
   * @param {number} crc
   * @param {VM_StandardFilters} type
   */
  constructor(length, crc, type) {
    /** @type {number} */
    this.Length = length;

    /** @type {number} */
    this.CRC = crc;

    /** @type {VM_StandardFilters} */
    this.Type = type;
  }
}

/**
 * @type {Array<StandardFilterSignature>}
 */
const StdList = [
  new StandardFilterSignature(53, 0xad576887, VM_StandardFilters.VMSF_E8),
  new StandardFilterSignature(57, 0x3cd7e57e, VM_StandardFilters.VMSF_E8E9),
  new StandardFilterSignature(120, 0x3769893f, VM_StandardFilters.VMSF_ITANIUM),
  new StandardFilterSignature(29, 0x0e06077d, VM_StandardFilters.VMSF_DELTA),
  new StandardFilterSignature(149, 0x1c2c5dc8, VM_StandardFilters.VMSF_RGB),
  new StandardFilterSignature(216, 0xbc85e701, VM_StandardFilters.VMSF_AUDIO),
  new StandardFilterSignature(40, 0x46b9c560, VM_StandardFilters.VMSF_UPCASE),
];

/**
 * @constructor
 */
class RarVM {
  constructor() {
    /** @private {Uint8Array} */
    this.mem_ = null;

    /** @private {Uint32Array<number>} */
    this.R_ = new Uint32Array(8);

    /** @private {number} */
    this.flags_ = 0;
  }

  /**
   * Initializes the memory of the VM.
   */
  init() {
    if (!this.mem_) {
      this.mem_ = new Uint8Array(VM_MEMSIZE);
    }
  }

  /**
   * @param {Uint8Array} code
   * @return {VM_StandardFilters}
   */
  isStandardFilter(code) {
    const codeCRC = (CRC(0xffffffff, code, code.length) ^ 0xffffffff) >>> 0;
    for (let i = 0; i < StdList.length; ++i) {
      if (StdList[i].CRC == codeCRC && StdList[i].Length == code.length)
        return StdList[i].Type;
    }

    return VM_StandardFilters.VMSF_NONE;
  }

  /**
   * @param {VM_PreparedOperand} op
   * @param {boolean} byteMode
   * @param {bitjs.io.BitStream} bstream A rtl bit stream.
   */
  decodeArg(op, byteMode, bstream) {
    const data = bstream.peekBits(16);
    if (data & 0x8000) {
      op.Type = VM_OpType.VM_OPREG;        // Operand is register (R[0]..R[7])
      bstream.readBits(1);                 // 1 flag bit and...
      op.Data = bstream.readBits(3);       // ... 3 register number bits
      op.Addr = [this.R_[op.Data]] // TODO &R[Op.Data] // Register address
    } else {
      if ((data & 0xc000) == 0) {
        op.Type = VM_OpType.VM_OPINT; // Operand is integer
        bstream.readBits(2); // 2 flag bits
        if (byteMode) {
          op.Data = bstream.readBits(8);         // Byte integer.
        } else {
          op.Data = RarVM.readData(bstream);     // 32 bit integer.
        }
      } else {
        // Operand is data addressed by register data, base address or both.
        op.Type = VM_OpType.VM_OPREGMEM;
        if ((data & 0x2000) == 0) {
          bstream.readBits(3); // 3 flag bits
          // Base address is zero, just use the address from register.
          op.Data = bstream.readBits(3); // (Data>>10)&7
          op.Addr = [this.R_[op.Data]]; // TODO &R[op.Data]
          op.Base = 0;
        } else {
          bstream.readBits(4); // 4 flag bits
          if ((data & 0x1000) == 0) {
            // Use both register and base address.
            op.Data = bstream.readBits(3);
            op.Addr = [this.R_[op.Data]]; // TODO &R[op.Data]
          } else {
            // Use base address only. Access memory by fixed address.
            op.Data = 0;
          }
          op.Base = RarVM.readData(bstream); // Read base address.
        }
      }
    }
  }

  /**
   * @param {VM_PreparedProgram} prg
   */
  execute(prg) {
    this.R_.set(prg.InitR);

    const globalSize = Math.min(prg.GlobalData.length, VM_GLOBALMEMSIZE);
    if (globalSize) {
      this.mem_.set(prg.GlobalData.subarray(0, globalSize), VM_GLOBALMEMADDR);
    }

    const staticSize = Math.min(prg.StaticData.length, VM_GLOBALMEMSIZE - globalSize);
    if (staticSize) {
      this.mem_.set(prg.StaticData.subarray(0, staticSize), VM_GLOBALMEMADDR + globalSize);
    }

    this.R_[7] = VM_MEMSIZE;
    this.flags_ = 0;

    const preparedCodes = prg.AltCmd ? prg.AltCmd : prg.Cmd;
    if (prg.Cmd.length > 0 && !this.executeCode(preparedCodes)) {
      // Invalid VM program. Let's replace it with 'return' command.
      preparedCode.OpCode = VM_Commands.VM_RET;
    }

    const dataView = new DataView(this.mem_.buffer, VM_GLOBALMEMADDR);
    let newBlockPos = dataView.getUint32(0x20, true /* little endian */) & VM_MEMMASK;
    const newBlockSize = dataView.getUint32(0x1c, true /* little endian */) & VM_MEMMASK;
    if (newBlockPos + newBlockSize >= VM_MEMSIZE) {
      newBlockPos = newBlockSize = 0;
    }
    prg.FilteredData = this.mem_.subarray(newBlockPos, newBlockPos + newBlockSize);

    prg.GlobalData = new Uint8Array(0);

    const dataSize = Math.min(dataView.getUint32(0x30), (VM_GLOBALMEMSIZE - VM_FIXEDGLOBALSIZE));
    if (dataSize != 0) {
      const len = dataSize + VM_FIXEDGLOBALSIZE;
      prg.GlobalData = new Uint8Array(len);
      prg.GlobalData.set(mem.subarray(VM_GLOBALMEMADDR, VM_GLOBALMEMADDR + len));
    }
  }

  /**
   * @param {Array<VM_PreparedCommand>} preparedCodes
   * @return {boolean}
   */
  executeCode(preparedCodes) {
    let codeIndex = 0;
    let cmd = preparedCodes[codeIndex];
    // TODO: Why is this an infinite loop instead of just returning
    // when a VM_RET is hit?
    while (1) {
      switch (cmd.OpCode) {
        case VM_Commands.VM_RET:
          if (this.R_[7] >= VM_MEMSIZE) {
            return true;
          }
          //SET_IP(GET_VALUE(false,(uint *)&Mem[R[7] & VM_MEMMASK]));
          this.R_[7] += 4;
          continue;

        case VM_Commands.VM_STANDARD:
          this.executeStandardFilter(cmd.Op1.Data);
          break;

        default:
          console.error('RarVM OpCode not supported: ' + getDebugString(VM_Commands, cmd.OpCode));
          break;
      } // switch (cmd.OpCode)
      codeIndex++;
      cmd = preparedCodes[codeIndex];
    }
  }

  /**
   * @param {number} filterType
   */
  executeStandardFilter(filterType) {
    switch (filterType) {
      case VM_StandardFilters.VMSF_RGB: {
        const dataSize = this.R_[4];
        const width = this.R_[0] - 3;
        const posR = this.R_[1];
        const Channels = 3;
        let srcOffset = 0;
        let destOffset = dataSize;

        // byte *SrcData=Mem,*DestData=SrcData+DataSize;
        // SET_VALUE(false,&Mem[VM_GLOBALMEMADDR+0x20],DataSize);
        const dataView = new DataView(this.mem_.buffer, VM_GLOBALMEMADDR /* offset */);
        dataView.setUint32(0x20 /* byte offset */,
            dataSize /* value */,
            true /* little endian */);

        if (dataSize >= (VM_GLOBALMEMADDR / 2) || posR < 0) {
          break;
        }

        for (let curChannel = 0; curChannel < Channels; ++curChannel) {
          let prevByte=0;

          for (let i = curChannel; i < dataSize; i += Channels) {
            let predicted;
            const upperPos = i - width;
            if (upperPos >= 3) {
              const upperByte = this.mem_[destOffset + upperPos];
              const upperLeftByte = this.mem_[destOffset + upperPos - 3];
              predicted = prevByte + upperByte - upperLeftByte;

              const pa = Math.abs(predicted - prevByte);
              const pb = Math.abs(predicted - upperByte);
              const pc = Math.abs(predicted - upperLeftByte);
              if (pa <= pb && pa <= pc) {
                predicted = prevByte;
              } else if (pb <= pc) {
                predicted = upperByte;
              } else {
                predicted = upperLeftByte;
              }
            } else {
              predicted = prevByte;
            }
            //DestData[I]=PrevByte=(byte)(Predicted-*(SrcData++));
            prevByte = (predicted - this.mem_[srcOffset++]) & 0xff;
            this.mem_[destOffset + i] = prevByte;
          }
        }
        for (let i = posR, border = dataSize - 2; i < border; i += 3) {
          const g = this.mem_[destOffset + i + 1];
          this.mem_[destOffset + i] += g;
          this.mem_[destOffset + i + 2] += g;
        }

        break;
      }

      // The C++ version of this standard filter uses an odd mixture of
      // signed and unsigned integers, bytes and various casts.  Careful!
      case VM_StandardFilters.VMSF_AUDIO: {
        const dataSize = this.R_[4];
        const channels = this.R_[0];
        let srcOffset = 0;
        let destOffset = dataSize;

        //SET_VALUE(false,&Mem[VM_GLOBALMEMADDR+0x20],DataSize);
        const dataView = new DataView(this.mem_.buffer, VM_GLOBALMEMADDR);
        dataView.setUint32(0x20 /* byte offset */,
            dataSize /* value */,
            true /* little endian */);

        if (dataSize >= VM_GLOBALMEMADDR / 2) {
          break;
        }

        for (let curChannel = 0; curChannel < channels; ++curChannel) {
          let prevByte = 0; // uint
          let prevDelta = 0; // uint
          let dif = [0, 0, 0, 0, 0, 0, 0];
          let d1 = 0, d2 = 0, d3; // ints
          let k1 = 0, k2 = 0, k3 = 0; // ints

          for (var i = curChannel, byteCount = 0;
              i < dataSize;
              i += channels, ++byteCount) {
            d3 = d2;
            d2 = fromUnsigned32ToSigned32(prevDelta - d1);
            d1 = fromUnsigned32ToSigned32(prevDelta);

            let predicted = fromSigned32ToUnsigned32(8*prevByte + k1*d1 + k2*d2 + k3*d3); // uint
            predicted = (predicted >>> 3) & 0xff;

            let curByte = this.mem_[srcOffset++]; // uint

            // Predicted-=CurByte;
            predicted = fromSigned32ToUnsigned32(predicted - curByte);
            this.mem_[destOffset + i] = (predicted & 0xff);

            // PrevDelta=(signed char)(Predicted-PrevByte);
            // where Predicted, PrevByte, PrevDelta are all unsigned int (32)
            // casting this subtraction to a (signed char) is kind of invalid
            // but it does the following:
            // - do the subtraction
            // - get the bottom 8 bits of the result
            // - if it was >= 0x80, then the value is negative (subtract 0x100)
            // - if the value is now negative, add 0x100000000 to make unsigned
            //
            // Example:
            //   predicted = 101
            //   prevByte = 4294967158
            //   (predicted - prevByte) = -4294967057
            //   take lower 8 bits:  1110 1111 = 239
            //   since > 127, subtract 256 = -17
            //   since < 0, add 0x100000000 = 4294967279
            prevDelta = fromSigned32ToUnsigned32(
                            fromUnsigned8ToSigned8((predicted - prevByte) & 0xff));
            prevByte = predicted;

            // int D=((signed char)CurByte)<<3;
            let curByteAsSignedChar = fromUnsigned8ToSigned8(curByte); // signed char
            let d = (curByteAsSignedChar << 3);

            dif[0] += Math.abs(d);
            dif[1] += Math.abs(d-d1);
            dif[2] += Math.abs(d+d1);
            dif[3] += Math.abs(d-d2);
            dif[4] += Math.abs(d+d2);
            dif[5] += Math.abs(d-d3);
            dif[6] += Math.abs(d+d3);

            if ((byteCount & 0x1f) == 0) {
              let minDif = dif[0], numMinDif = 0;
              dif[0] = 0;
              for (let j = 1; j < 7; ++j) {
                if (dif[j] < minDif) {
                  minDif = dif[j];
                  numMinDif = j;
                }
                dif[j] = 0;
              }
              switch (numMinDif) {
                case 1: if (k1>=-16) k1--; break;
                case 2: if (k1 < 16) k1++; break;
                case 3: if (k2>=-16) k2--; break;
                case 4: if (k2 < 16) k2++; break;
                case 5: if (k3>=-16) k3--; break;
                case 6: if (k3 < 16) k3++; break;
              }
            }
          }
        }

        break;
      }

      case VM_StandardFilters.VMSF_DELTA: {
        const dataSize = this.R_[4];
        const channels = this.R_[0];
        let srcPos = 0;
        const border = dataSize * 2;

        //SET_VALUE(false,&Mem[VM_GLOBALMEMADDR+0x20],DataSize);
        const dataView = new DataView(this.mem_.buffer, VM_GLOBALMEMADDR);
        dataView.setUint32(0x20 /* byte offset */,
            dataSize /* value */,
            true /* little endian */);

        if (dataSize >= VM_GLOBALMEMADDR / 2) {
          break;
        }

        // Bytes from same channels are grouped to continual data blocks,
        // so we need to place them back to their interleaving positions.
        for (let curChannel = 0; curChannel < channels; ++curChannel) {
          let prevByte = 0;
          for (let destPos = dataSize + curChannel; destPos < border; destPos += channels) {
            prevByte = (prevByte - this.mem_[srcPos++]) & 0xff;
            this.mem_[destPos] = prevByte;
          }
        }

        break;
      }

      default:
        console.error('RarVM Standard Filter not supported: ' + getDebugString(VM_StandardFilters, filterType));
        break;
    }
  }

  /**
   * @param {Uint8Array} code
   * @param {VM_PreparedProgram} prg
   */
  prepare(code, prg) {
    let codeSize = code.length;

    //InitBitInput();
    //memcpy(InBuf,Code,Min(CodeSize,BitInput::MAX_SIZE));
    const bstream = new bitjs.io.BitStream(code.buffer, true /* rtl */);

    // Calculate the single byte XOR checksum to check validity of VM code.
    let xorSum = 0;
    for (let i = 1; i < codeSize; ++i) {
      xorSum ^= code[i];
    }

    bstream.readBits(8);

    prg.Cmd = [];  // TODO: Is this right?  I don't see it being done in rarvm.cpp.

    // VM code is valid if equal.
    if (xorSum == code[0]) {
      const filterType = this.isStandardFilter(code);
      if (filterType != VM_StandardFilters.VMSF_NONE) {
        // VM code is found among standard filters.
        const curCmd = new VM_PreparedCommand();
        prg.Cmd.push(curCmd);

        curCmd.OpCode = VM_Commands.VM_STANDARD;
        curCmd.Op1.Data = filterType;
        // TODO: Addr=&CurCmd->Op1.Data
        curCmd.Op1.Addr = [curCmd.Op1.Data];
        curCmd.Op2.Addr = [null]; // &CurCmd->Op2.Data;
        curCmd.Op1.Type = VM_OpType.VM_OPNONE;
        curCmd.Op2.Type = VM_OpType.VM_OPNONE;
        codeSize = 0;
      }

      const dataFlag = bstream.readBits(1);

      // Read static data contained in DB operators. This data cannot be
      // changed, it is a part of VM code, not a filter parameter.

      if (dataFlag & 0x8000) {
        const dataSize = RarVM.readData(bstream) + 1;
        // TODO: This accesses the byte pointer of the bstream directly.  Is that ok?
        for (let i = 0; i < bstream.bytePtr < codeSize && i < dataSize; ++i) {
          // Append a byte to the program's static data.
          const newStaticData = new Uint8Array(prg.StaticData.length + 1);
          newStaticData.set(prg.StaticData);
          newStaticData[newStaticData.length - 1] = bstream.readBits(8);
          prg.StaticData = newStaticData;
        }
      }

      while (bstream.bytePtr < codeSize) {
        const curCmd = new VM_PreparedCommand();
        prg.Cmd.push(curCmd); // Prg->Cmd.Add(1)
        const flag = bstream.peekBits(1);
        if (!flag) { // (Data&0x8000)==0
          curCmd.OpCode = bstream.readBits(4);
        } else {
          curCmd.OpCode = (bstream.readBits(6) - 24);
        }

        if (VM_CmdFlags[curCmd.OpCode] & VMCF_BYTEMODE) {
          curCmd.ByteMode = (bstream.readBits(1) != 0);
        } else {
          curCmd.ByteMode = 0;
        }
        curCmd.Op1.Type = VM_OpType.VM_OPNONE;
        curCmd.Op2.Type = VM_OpType.VM_OPNONE;
        const opNum = (VM_CmdFlags[curCmd.OpCode] & VMCF_OPMASK);
        curCmd.Op1.Addr = null;
        curCmd.Op2.Addr = null;
        if (opNum > 0) {
          this.decodeArg(curCmd.Op1, curCmd.ByteMode, bstream); // reading the first operand
          if (opNum == 2) {
            this.decodeArg(curCmd.Op2, curCmd.ByteMode, bstream); // reading the second operand
          } else {
            if (curCmd.Op1.Type == VM_OpType.VM_OPINT && (VM_CmdFlags[curCmd.OpCode] & (VMCF_JUMP|VMCF_PROC))) {
              // Calculating jump distance.
              let distance = curCmd.Op1.Data;
              if (distance >= 256) {
                distance -= 256;
              } else {
                if (distance >= 136) {
                  distance -= 264;
                } else {
                  if (distance >= 16) {
                    distance -= 8;
                  } else {
                    if (distance >= 8) {
                      distance -= 16;
                    }
                  }
                }
                distance += prg.Cmd.length;
              }
              curCmd.Op1.Data = distance;
            }
          }
        } // if (OpNum>0)
      } // while ((uint)InAddr<CodeSize)
    } // if (XorSum==Code[0])

    const curCmd = new VM_PreparedCommand();
    prg.Cmd.push(curCmd);
    curCmd.OpCode = VM_Commands.VM_RET;
    // TODO: Addr=&CurCmd->Op1.Data
    curCmd.Op1.Addr = [curCmd.Op1.Data];
    curCmd.Op2.Addr = [curCmd.Op2.Data];
    curCmd.Op1.Type = VM_OpType.VM_OPNONE;
    curCmd.Op2.Type = VM_OpType.VM_OPNONE;

    // If operand 'Addr' field has not been set by DecodeArg calls above,
    // let's set it to point to operand 'Data' field. It is necessary for
    // VM_OPINT type operands (usual integers) or maybe if something was
    // not set properly for other operands. 'Addr' field is required
    // for quicker addressing of operand data.
    for (let i = 0; i < prg.Cmd.length; ++i) {
      const cmd = prg.Cmd[i];
      if (cmd.Op1.Addr == null) {
        cmd.Op1.Addr = [cmd.Op1.Data];
      }
      if (cmd.Op2.Addr == null) {
        cmd.Op2.Addr = [cmd.Op2.Data];
      }
    }

  /*
  #ifdef VM_OPTIMIZE
    if (CodeSize!=0)
      Optimize(Prg);
  #endif
    */
  }

  /**
   * @param {Uint8Array} arr The byte array to set a value in.
   * @param {number} value The unsigned 32-bit value to set.
   * @param {number} offset Offset into arr to start setting the value, defaults to 0.
   */
  setLowEndianValue(arr, value, offset) {
    const i = offset || 0;
    arr[i]     = value & 0xff;
    arr[i + 1] = (value >>> 8) & 0xff;
    arr[i + 2] = (value >>> 16) & 0xff;
    arr[i + 3] = (value >>> 24) & 0xff;
  }

  /**
   * Sets a number of bytes of the VM memory at the given position from a
   * source buffer of bytes.
   * @param {number} pos The position in the VM memory to start writing to.
   * @param {Uint8Array} buffer The source buffer of bytes.
   * @param {number} dataSize The number of bytes to set.
   */
  setMemory(pos, buffer, dataSize) {
    if (pos < VM_MEMSIZE) {
      const numBytes = Math.min(dataSize, VM_MEMSIZE - pos);
      for (let i = 0; i < numBytes; ++i) {
        this.mem_[pos + i] = buffer[i];
      }
    }
  }

  /**
   * Static function that reads in the next set of bits for the VM
   * (might return 4, 8, 16 or 32 bits).
   * @param {bitjs.io.BitStream} bstream A RTL bit stream.
   * @return {number} The value of the bits read.
   */
  static readData(bstream) {
    // Read in the first 2 bits.
    const flags = bstream.readBits(2);
    switch (flags) { // Data&0xc000
      // Return the next 4 bits.
      case 0:
        return bstream.readBits(4); // (Data>>10)&0xf

      case 1: // 0x4000
        // 0x3c00 => 0011 1100 0000 0000
        if (bstream.peekBits(4) == 0) { // (Data&0x3c00)==0
          // Skip the 4 zero bits.
          bstream.readBits(4);
          // Read in the next 8 and pad with 1s to 32 bits.
          return (0xffffff00 | bstream.readBits(8)) >>> 0; // ((Data>>2)&0xff)
        }

        // Else, read in the next 8.
        return bstream.readBits(8);

      // Read in the next 16.
      case 2: // 0x8000
        const val = bstream.getBits();
        bstream.readBits(16);
        return val; //bstream.readBits(16);

      // case 3
      default:
        return (bstream.readBits(16) << 16) | bstream.readBits(16);
    }
  }
}

// ============================================================================================== //


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

// shows a byte value as its hex representation
const nibble = "0123456789ABCDEF";
const byteValueToHexString = function(num) {
  return nibble[num>>4] + nibble[num&0xF];
};
const twoByteValueToHexString = function(num) {
  return nibble[(num>>12)&0xF] + nibble[(num>>8)&0xF] + nibble[(num>>4)&0xF] + nibble[num&0xF];
};


// Volume Types
const MARK_HEAD      = 0x72;
const MAIN_HEAD      = 0x73;
const FILE_HEAD      = 0x74;
const COMM_HEAD      = 0x75;
const AV_HEAD        = 0x76;
const SUB_HEAD       = 0x77;
const PROTECT_HEAD   = 0x78;
const SIGN_HEAD      = 0x79;
const NEWSUB_HEAD    = 0x7a;
const ENDARC_HEAD    = 0x7b;

// ============================================================================================== //

/**
 */
class RarVolumeHeader {
  /**
   * @param {bitjs.io.BitStream} bstream
   */
  constructor(bstream) {
    const headPos = bstream.bytePtr;
    // byte 1,2
    info("Rar Volume Header @"+bstream.bytePtr);

    this.crc = bstream.readBits(16);
    info("  crc=" + this.crc);

    // byte 3
    this.headType = bstream.readBits(8);
    info("  headType=" + this.headType);

    // Get flags
    // bytes 4,5
    this.flags = {};
    this.flags.value = bstream.peekBits(16);
    
    info("  flags=" + twoByteValueToHexString(this.flags.value));
    switch (this.headType) {
    case MAIN_HEAD:
      this.flags.MHD_VOLUME = !!bstream.readBits(1);
      this.flags.MHD_COMMENT = !!bstream.readBits(1);
      this.flags.MHD_LOCK = !!bstream.readBits(1);
      this.flags.MHD_SOLID = !!bstream.readBits(1);
      this.flags.MHD_PACK_COMMENT = !!bstream.readBits(1);
      this.flags.MHD_NEWNUMBERING = this.flags.MHD_PACK_COMMENT;
      this.flags.MHD_AV = !!bstream.readBits(1);
      this.flags.MHD_PROTECT = !!bstream.readBits(1);
      this.flags.MHD_PASSWORD = !!bstream.readBits(1);
      this.flags.MHD_FIRSTVOLUME = !!bstream.readBits(1);
      this.flags.MHD_ENCRYPTVER = !!bstream.readBits(1);
      bstream.readBits(6); // unused
      break;
    case FILE_HEAD:
      this.flags.LHD_SPLIT_BEFORE = !!bstream.readBits(1); // 0x0001
      this.flags.LHD_SPLIT_AFTER = !!bstream.readBits(1); // 0x0002
      this.flags.LHD_PASSWORD = !!bstream.readBits(1); // 0x0004
      this.flags.LHD_COMMENT = !!bstream.readBits(1); // 0x0008
      this.flags.LHD_SOLID = !!bstream.readBits(1); // 0x0010
      bstream.readBits(3); // unused
      this.flags.LHD_LARGE = !!bstream.readBits(1); // 0x0100
      this.flags.LHD_UNICODE = !!bstream.readBits(1); // 0x0200
      this.flags.LHD_SALT = !!bstream.readBits(1); // 0x0400
      this.flags.LHD_VERSION = !!bstream.readBits(1); // 0x0800
      this.flags.LHD_EXTTIME = !!bstream.readBits(1); // 0x1000
      this.flags.LHD_EXTFLAGS = !!bstream.readBits(1); // 0x2000
      bstream.readBits(2); // unused
      info("  LHD_SPLIT_BEFORE = " + this.flags.LHD_SPLIT_BEFORE);
      break;
    default:
      bstream.readBits(16);
    }
    
    // byte 6,7
    this.headSize = bstream.readBits(16);
    info("  headSize=" + this.headSize);
    switch (this.headType) {
    case MAIN_HEAD:
      this.highPosAv = bstream.readBits(16);
      this.posAv = bstream.readBits(32);
      if (this.flags.MHD_ENCRYPTVER) {
        this.encryptVer = bstream.readBits(8);
      }
      info("Found MAIN_HEAD with highPosAv=" + this.highPosAv + ", posAv=" + this.posAv);
      break;
    case FILE_HEAD:
      this.packSize = bstream.readBits(32);
      this.unpackedSize = bstream.readBits(32);
      this.hostOS = bstream.readBits(8);
      this.fileCRC = bstream.readBits(32);
      this.fileTime = bstream.readBits(32);
      this.unpVer = bstream.readBits(8);
      this.method = bstream.readBits(8);
      this.nameSize = bstream.readBits(16);
      this.fileAttr = bstream.readBits(32);
      
      if (this.flags.LHD_LARGE) {
        info("Warning: Reading in LHD_LARGE 64-bit size values");
        this.HighPackSize = bstream.readBits(32);
        this.HighUnpSize = bstream.readBits(32);
      } else {
        this.HighPackSize = 0;
        this.HighUnpSize = 0;
        if (this.unpackedSize == 0xffffffff) {
          this.HighUnpSize = 0x7fffffff
          this.unpackedSize = 0xffffffff;
        }
      }
      this.fullPackSize = 0;
      this.fullUnpackSize = 0;
      this.fullPackSize |= this.HighPackSize;
      this.fullPackSize <<= 32;
      this.fullPackSize |= this.packSize;

      // read in filename

      this.filename = bstream.readBytes(this.nameSize);
      let _s = '';
      for (let _i = 0; _i < this.filename.length; _i++) {
        _s += String.fromCharCode(this.filename[_i]);
      }

      this.filename = _s;

      if (this.flags.LHD_SALT) {
        info("Warning: Reading in 64-bit salt value");
        this.salt = bstream.readBits(64); // 8 bytes
      }

      if (this.flags.LHD_EXTTIME) {
        // 16-bit flags
        const extTimeFlags = bstream.readBits(16);
        
        // this is adapted straight out of arcread.cpp, Archive::ReadHeader()
        for (let I = 0; I < 4; ++I) {
          const rmode = extTimeFlags >> ((3 - I) * 4);
          if ((rmode & 8) == 0) {
            continue;
          }
          if (I != 0)
            bstream.readBits(16);
            const count = (rmode & 3);
            for (let J = 0; J < count; ++J) {
              bstream.readBits(8);
            }
        }
      }

      if (this.flags.LHD_COMMENT) {
        info("Found a LHD_COMMENT");
      }

      while (headPos + this.headSize > bstream.bytePtr) {
        bstream.readBits(1);
      }

      info("Found FILE_HEAD with packSize=" + this.packSize + ", unpackedSize= " + this.unpackedSize + ", hostOS=" + this.hostOS + ", unpVer=" + this.unpVer + ", method=" + this.method + ", filename=" + this.filename);

      break;
    default:
      info("Found a header of type 0x" + byteValueToHexString(this.headType));
      // skip the rest of the header bytes (for now)
      bstream.readBytes(this.headSize - 7);
      break;
    }
  }
}

const BLOCK_LZ = 0;
const BLOCK_PPM = 1;

const rLDecode = [0,1,2,3,4,5,6,7,8,10,12,14,16,20,24,28,32,40,48,56,64,80,96,112,128,160,192,224];
const rLBits = [0,0,0,0,0,0,0,0,1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4,  4,  5,  5,  5,  5];
const rDBitLengthCounts = [4,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,14,0,12];
const rSDDecode = [0,4,8,16,32,64,128,192];
const rSDBits = [2,2,3, 4, 5, 6,  6,  6];
  
const rDDecode = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32,
			48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048, 3072,
			4096, 6144, 8192, 12288, 16384, 24576, 32768, 49152, 65536, 98304,
			131072, 196608, 262144, 327680, 393216, 458752, 524288, 589824,
			655360, 720896, 786432, 851968, 917504, 983040];

const rDBits = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5,
			5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14,
			15, 15, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16];

const rLOW_DIST_REP_COUNT = 16;

const rNC = 299;
const rDC = 60;
const rLDC = 17;
const rRC = 28;
const rBC = 20;
const rHUFF_TABLE_SIZE = (rNC+rDC+rRC+rLDC);

const UnpOldTable = new Array(rHUFF_TABLE_SIZE);

const BD = { //bitdecode
  DecodeLen: new Array(16),
  DecodePos: new Array(16),
  DecodeNum: new Array(rBC)
};
const LD = { //litdecode
  DecodeLen: new Array(16),
  DecodePos: new Array(16),
  DecodeNum: new Array(rNC)
};
const DD = { //distdecode
  DecodeLen: new Array(16),
  DecodePos: new Array(16),
  DecodeNum: new Array(rDC)
};
const LDD = { //low dist decode
  DecodeLen: new Array(16),
  DecodePos: new Array(16),
  DecodeNum: new Array(rLDC)
};
const RD = { //rep decode
  DecodeLen: new Array(16),
  DecodePos: new Array(16),
  DecodeNum: new Array(rRC)
};

/**
 * @type {Array<bitjs.io.ByteBuffer>}
 */
const rOldBuffers = [];

/**
 * The current buffer we are unpacking to.
 * @type {bitjs.io.ByteBuffer}
 */
let rBuffer;

/**
 * The buffer of the final bytes after filtering (only used in Unpack29).
 * @type {bitjs.io.ByteBuffer}
 */
let wBuffer;


/**
 * In unpack.cpp, UnpPtr keeps track of what bytes have been unpacked
 * into the Window buffer and WrPtr keeps track of what bytes have been
 * actually written to disk after the unpacking and optional filtering
 * has been done.
 *
 * In our case, rBuffer is the buffer for the unpacked bytes and wBuffer is
 * the final output bytes.
 */


/**
 * Read in Huffman tables for RAR
 * @param {bitjs.io.BitStream} bstream
 */
function RarReadTables(bstream) {
  const BitLength = new Array(rBC);
  const Table = new Array(rHUFF_TABLE_SIZE);

  // before we start anything we need to get byte-aligned
  bstream.readBits( (8 - bstream.bitPtr) & 0x7 );
  
  if (bstream.readBits(1)) {
    info("Error!  PPM not implemented yet");
    return;
  }
  
  if (!bstream.readBits(1)) { //discard old table
    for (let i = UnpOldTable.length; i--;) {
      UnpOldTable[i] = 0;
    }
  }

  // read in bit lengths
  for (let I = 0; I < rBC; ++I) {
    const Length = bstream.readBits(4);
    if (Length == 15) {
      let ZeroCount = bstream.readBits(4);
      if (ZeroCount == 0) {
        BitLength[I] = 15;
      }
      else {
        ZeroCount += 2;
        while (ZeroCount-- > 0 && I < rBC)
          BitLength[I++] = 0;
        --I;
      }
    }
    else {
      BitLength[I] = Length;
    }
  }
  
  // now all 20 bit lengths are obtained, we construct the Huffman Table:

  RarMakeDecodeTables(BitLength, 0, BD, rBC);
  
  const TableSize = rHUFF_TABLE_SIZE;
  for (let i = 0; i < TableSize;) {
    const num = RarDecodeNumber(bstream, BD);
    if (num < 16) {
      Table[i] = (num + UnpOldTable[i]) & 0xf;
      i++;
    } else if (num < 18) {
      let N = (num == 16) ? (bstream.readBits(3) + 3) : (bstream.readBits(7) + 11);

      while (N-- > 0 && i < TableSize) {
        Table[i] = Table[i - 1];
        i++;
      }
    } else {
      let N = (num == 18) ? (bstream.readBits(3) + 3) : (bstream.readBits(7) + 11);

      while (N-- > 0 && i < TableSize) {
        Table[i++] = 0;
      }
    }
  }
  
  RarMakeDecodeTables(Table, 0, LD, rNC);
  RarMakeDecodeTables(Table, rNC, DD, rDC);
  RarMakeDecodeTables(Table, rNC + rDC, LDD, rLDC);
  RarMakeDecodeTables(Table, rNC + rDC + rLDC, RD, rRC);  
  
  for (let i = UnpOldTable.length; i--;) {
    UnpOldTable[i] = Table[i];
  }
  return true;
}


function RarDecodeNumber(bstream, dec) {
  const DecodeLen = dec.DecodeLen;
  const DecodePos = dec.DecodePos;
  const DecodeNum = dec.DecodeNum;
  const bitField = bstream.getBits() & 0xfffe;
  //some sort of rolled out binary search
  const bits = ((bitField < DecodeLen[8])?
    ((bitField < DecodeLen[4])?
      ((bitField < DecodeLen[2])?
        ((bitField < DecodeLen[1])?1:2)
       :((bitField < DecodeLen[3])?3:4))
     :(bitField < DecodeLen[6])?
        ((bitField < DecodeLen[5])?5:6)
        :((bitField < DecodeLen[7])?7:8))
    :((bitField < DecodeLen[12])?
      ((bitField < DecodeLen[10])?
        ((bitField < DecodeLen[9])?9:10)
       :((bitField < DecodeLen[11])?11:12))
     :(bitField < DecodeLen[14])?
        ((bitField < DecodeLen[13])?13:14)
        :15));
  bstream.readBits(bits);
  const N = DecodePos[bits] + ((bitField - DecodeLen[bits -1]) >>> (16 - bits));
  
  return DecodeNum[N];
}


function RarMakeDecodeTables(BitLength, offset, dec, size) {
  const DecodeLen = dec.DecodeLen;
  const DecodePos = dec.DecodePos;
  const DecodeNum = dec.DecodeNum;
  const LenCount = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  const TmpPos = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  let N = 0;
  let M = 0;

  for (let i = DecodeNum.length; i--;) {
    DecodeNum[i] = 0;
  }
  for (let i = 0; i < size; i++) {
    LenCount[BitLength[i + offset] & 0xF]++;
  }
  LenCount[0] = 0;
  TmpPos[0] = 0;
  DecodePos[0] = 0;
  DecodeLen[0] = 0;
  
  for (let I = 1; I < 16; ++I) {
    N = 2 * (N+LenCount[I]);
    M = (N << (15-I));
    if (M > 0xFFFF) {
      M = 0xFFFF;
    }
    DecodeLen[I] = M;
    DecodePos[I] = DecodePos[I-1] + LenCount[I-1];
    TmpPos[I] = DecodePos[I];
  }
  for (let I = 0; I < size; ++I) {
    if (BitLength[I + offset] != 0) {
      DecodeNum[ TmpPos[ BitLength[offset + I] & 0xF ]++] = I;
    }
  }

}

// TODO: implement
/**
 * @param {bitjs.io.BitStream} bstream
 * @param {boolean} Solid
 */
function Unpack15(bstream, Solid) {
  info("ERROR!  RAR 1.5 compression not supported");
}

/**
 * Unpacks the bit stream into rBuffer using the Unpack20 algorithm.
 * @param {bitjs.io.BitStream} bstream
 * @param {boolean} Solid
 */
function Unpack20(bstream, Solid) {
  const destUnpSize = rBuffer.data.length;
  let oldDistPtr = 0;

  if (!Solid) {
    RarReadTables20(bstream);
  }
  while (destUnpSize > rBuffer.ptr) {
    let num = RarDecodeNumber(bstream, LD);
    if (num < 256) {
      rBuffer.insertByte(num);
      continue;
    }
    if (num > 269) {
      let Length = rLDecode[num -= 270] + 3;
      if ((Bits = rLBits[num]) > 0) {
        Length += bstream.readBits(Bits);
      }
      let DistNumber = RarDecodeNumber(bstream, DD);
      let Distance = rDDecode[DistNumber] + 1;
      if ((Bits = rDBits[DistNumber]) > 0) {
        Distance += bstream.readBits(Bits);
      }
      if (Distance >= 0x2000) {
        Length++;
        if (Distance >= 0x40000) {
          Length++;
        }
      }
      lastLength = Length;
      lastDist = rOldDist[oldDistPtr++ & 3] = Distance;
      RarCopyString(Length, Distance);
      continue;
    }
    if (num == 269) {
      RarReadTables20(bstream);
      RarUpdateProgress();
      continue;
    }
    if (num == 256) {
      lastDist = rOldDist[oldDistPtr++ & 3] = lastDist;
      RarCopyString(lastLength, lastDist);
      continue;
    }
    if (num < 261) {
      const Distance = rOldDist[(oldDistPtr - (num - 256)) & 3];
      const LengthNumber = RarDecodeNumber(bstream, RD);
      let Length = rLDecode[LengthNumber] +2;
      if ((Bits = rLBits[LengthNumber]) > 0) {
        Length += bstream.readBits(Bits);
      }
      if (Distance >= 0x101) {
        Length++;
        if (Distance >= 0x2000) {
          Length++
          if (Distance >= 0x40000) {
            Length++;
          }
        }
      }
      lastLength = Length;
      lastDist = rOldDist[oldDistPtr++ & 3] = Distance;
      RarCopyString(Length, Distance);
      continue;
    }
    if (num < 270) {
      let Distance = rSDDecode[num -= 261] + 1;
      if ((Bits = rSDBits[num]) > 0) {
        Distance += bstream.readBits(Bits);
      }
      lastLength = 2;
      lastDist = rOldDist[oldDistPtr++ & 3] = Distance;
      RarCopyString(2, Distance);
      continue;
    }
    
  }
  RarUpdateProgress();
}

function RarUpdateProgress() {
  const change = rBuffer.ptr - currentBytesUnarchivedInFile;
  currentBytesUnarchivedInFile = rBuffer.ptr;
  currentBytesUnarchived += change;
  postProgress();
}

const rNC20 = 298;
const rDC20 = 48;
const rRC20 = 28;
const rBC20 = 19;
const rMC20 = 257;

const UnpOldTable20 = new Array(rMC20 * 4);

// TODO: This function should return a boolean value, see unpack20.cpp.
function RarReadTables20(bstream) {
  const BitLength = new Array(rBC20);
  const Table = new Array(rMC20 * 4);
  let TableSize;
  let N;
  let I;
  const AudioBlock = bstream.readBits(1);
  if (!bstream.readBits(1)) {
    for (let i = UnpOldTable20.length; i--;) {
      UnpOldTable20[i] = 0;
    }
  }
  TableSize = rNC20 + rDC20 + rRC20;
  for (I = 0; I < rBC20; I++) {
    BitLength[I] = bstream.readBits(4);
  }
  RarMakeDecodeTables(BitLength, 0, BD, rBC20);
  I = 0;
  while (I < TableSize) {
    const num = RarDecodeNumber(bstream, BD);
    if (num < 16) {
      Table[I] = num + UnpOldTable20[I] & 0xf;
      I++;
    } else if (num == 16) {
      N = bstream.readBits(2) + 3;
      while (N-- > 0 && I < TableSize) {
        Table[I] = Table[I - 1];
        I++;
      }
    } else {
      if (num == 17) {
        N = bstream.readBits(3) + 3;
      } else {
        N = bstream.readBits(7) + 11;
      }
      while (N-- > 0 && I < TableSize) {
        Table[I++] = 0;
      }
    }
  }
  RarMakeDecodeTables(Table, 0, LD, rNC20);
  RarMakeDecodeTables(Table, rNC20, DD, rDC20);
  RarMakeDecodeTables(Table, rNC20 + rDC20, RD, rRC20);
  for (let i = UnpOldTable20.length; i--;) {
    UnpOldTable20[i] = Table[i];
  }
}

let lowDistRepCount = 0;
let prevLowDist = 0;

let rOldDist = [0,0,0,0];
let lastDist;
let lastLength;

// ============================================================================================== //

// Unpack code specific to RarVM
const VM = new RarVM();

/**
 * Filters code, one entry per filter.
 * @type {Array<UnpackFilter>}
 */
let Filters = [];

/**
 * Filters stack, several entrances of same filter are possible.
 * @type {Array<UnpackFilter>}
 */
let PrgStack = [];

/**
 * Lengths of preceding blocks, one length per filter. Used to reduce
 * size required to write block length if lengths are repeating.
 * @type {Array<number>}
 */
let OldFilterLengths = [];

let LastFilter = 0;

function InitFilters() {
  OldFilterLengths = [];
  LastFilter = 0;
  Filters = [];
  PrgStack = [];
}


/**
 * @param {number} firstByte The first byte (flags).
 * @param {Uint8Array} vmCode An array of bytes.
 */
function RarAddVMCode(firstByte, vmCode) {
  VM.init();
  const bstream = new bitjs.io.BitStream(vmCode.buffer, true /* rtl */);

  let filtPos;
  if (firstByte & 0x80) {
    filtPos = RarVM.readData(bstream);
    if (filtPos == 0) {
      InitFilters();
    } else {
      filtPos--;
    }
  } else {
    filtPos = LastFilter;
  }

  if (filtPos > Filters.length || filtPos > OldFilterLengths.length) {
    return false;
  }

  LastFilter = filtPos;
  const newFilter = (filtPos == Filters.length);

  // new filter for PrgStack
  const stackFilter = new UnpackFilter();
  let filter = null;
  // new filter code, never used before since VM reset
  if (newFilter) {
    // too many different filters, corrupt archive
    if (filtPos > 1024) {
      return false;
    }

    filter = new UnpackFilter();
    Filters.push(filter);
    stackFilter.ParentFilter = (Filters.length - 1);
    OldFilterLengths.push(0); // OldFilterLengths.Add(1)
    filter.ExecCount = 0;
  } else { // filter was used in the past
    filter = Filters[filtPos];
    stackFilter.ParentFilter = filtPos;
    filter.ExecCount++;
  }

  let emptyCount = 0;
  for (let i = 0; i < PrgStack.length; ++i) {
    PrgStack[i - emptyCount] = PrgStack[i];

    if (PrgStack[i] == null) {
      emptyCount++;
    }
    if (emptyCount > 0) {
      PrgStack[i] = null;
    }
  }

  if (emptyCount == 0) {
    PrgStack.push(null); //PrgStack.Add(1);
    emptyCount = 1;
  }

  const stackPos = PrgStack.length - emptyCount;
  PrgStack[stackPos] = stackFilter;
  stackFilter.ExecCount = filter.ExecCount;

  let blockStart = RarVM.readData(bstream);
  if (firstByte & 0x40) {
    blockStart += 258;
  }
  stackFilter.BlockStart = (blockStart + rBuffer.ptr) & MAXWINMASK;

  if (firstByte & 0x20) {
    stackFilter.BlockLength = RarVM.readData(bstream);
  } else {
    stackFilter.BlockLength = filtPos < OldFilterLengths.length
        ? OldFilterLengths[filtPos]
        : 0;
  }
  stackFilter.NextWindow = (wBuffer.ptr != rBuffer.ptr) &&
      (((wBuffer.ptr - rBuffer.ptr) & MAXWINMASK) <= blockStart);

  OldFilterLengths[filtPos] = stackFilter.BlockLength;

  for (let i = 0; i < 7; ++i) {
    stackFilter.Prg.InitR[i] = 0;
  }
  stackFilter.Prg.InitR[3] = VM_GLOBALMEMADDR;
  stackFilter.Prg.InitR[4] = stackFilter.BlockLength;
  stackFilter.Prg.InitR[5] = stackFilter.ExecCount;

  // set registers to optional parameters if any
  if (firstByte & 0x10) {
    const initMask = bstream.readBits(7);
    for (let i = 0; i < 7; ++i) {
      if (initMask & (1 << i)) {
        stackFilter.Prg.InitR[i] = RarVM.readData(bstream);
      }
    }
  }

  if (newFilter) {
    const vmCodeSize = RarVM.readData(bstream);
    if (vmCodeSize >= 0x10000 || vmCodeSize == 0) {
      return false;
    }
    const vmCode = new Uint8Array(vmCodeSize);
    for (let i = 0; i < vmCodeSize; ++i) {
      //if (Inp.Overflow(3))
      //  return(false);
      vmCode[i] = bstream.readBits(8);
    }
    VM.prepare(vmCode, filter.Prg);
  }
  stackFilter.Prg.Cmd = filter.Prg.Cmd;
  stackFilter.Prg.AltCmd = filter.Prg.Cmd;

  const staticDataSize = filter.Prg.StaticData.length;
  if (staticDataSize > 0 && staticDataSize < VM_GLOBALMEMSIZE) {
    // read statically defined data contained in DB commands
    for (let i = 0; i < staticDataSize; ++i) {
      stackFilter.Prg.StaticData[i] = filter.Prg.StaticData[i];
    }
  }

  if (stackFilter.Prg.GlobalData.length < VM_FIXEDGLOBALSIZE) {
    stackFilter.Prg.GlobalData = new Uint8Array(VM_FIXEDGLOBALSIZE);
  }

  const globalData = stackFilter.Prg.GlobalData;
  for (let i = 0; i < 7; ++i) {
    VM.setLowEndianValue(globalData, stackFilter.Prg.InitR[i], i * 4);
  }

  VM.setLowEndianValue(globalData, stackFilter.BlockLength, 0x1c);
  VM.setLowEndianValue(globalData, 0, 0x20);
  VM.setLowEndianValue(globalData, stackFilter.ExecCount, 0x2c);
  for (let i = 0; i < 16; ++i) {
    globalData[0x30 + i] = 0;
  }

  // put data block passed as parameter if any
  if (firstByte & 8) {
    //if (Inp.Overflow(3))
    //  return(false);
    const dataSize = RarVM.readData(bstream);
    if (dataSize > (VM_GLOBALMEMSIZE - VM_FIXEDGLOBALSIZE)) {
      return false;
    }

    const curSize = stackFilter.Prg.GlobalData.length;
    if (curSize < dataSize + VM_FIXEDGLOBALSIZE) {
      // Resize global data and update the stackFilter and local variable.
      const numBytesToAdd = dataSize + VM_FIXEDGLOBALSIZE - curSize;
      const newGlobalData = new Uint8Array(globalData.length + numBytesToAdd);
      newGlobalData.set(globalData);

      stackFilter.Prg.GlobalData = newGlobalData;
      globalData = newGlobalData;
    }
    //byte *GlobalData=&StackFilter->Prg.GlobalData[VM_FIXEDGLOBALSIZE];
    for (let i = 0; i < dataSize; ++i) {
      //if (Inp.Overflow(3))
      //  return(false);
      globalData[VM_FIXEDGLOBALSIZE + i] = bstream.readBits(8);
    }
  }

  return true;
}


/**
 * @param {!bitjs.io.BitStream} bstream
 */
function RarReadVMCode(bstream) {
  const firstByte = bstream.readBits(8);
  let length = (firstByte & 7) + 1;
  if (length == 7) {
    length = bstream.readBits(8) + 7;
  } else if (length == 8) {
    length = bstream.readBits(16);
  }

  // Read all bytes of VM code into an array.
  const vmCode = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    // Do something here with checking readbuf.
    vmCode[i] = bstream.readBits(8);
  }
  return RarAddVMCode(firstByte, vmCode);
}

/**
 * Unpacks the bit stream into rBuffer using the Unpack29 algorithm.
 * @param {bitjs.io.BitStream} bstream
 * @param {boolean} Solid
 */
function Unpack29(bstream, Solid) {
  // lazy initialize rDDecode and rDBits

  const DDecode = new Array(rDC);
  const DBits = new Array(rDC);
  
  let Dist = 0;
  let BitLength = 0;
  let Slot = 0;
  
  for (let I = 0; I < rDBitLengthCounts.length; I++,BitLength++) {
    for (let J = 0; J < rDBitLengthCounts[I]; J++,Slot++,Dist+=(1<<BitLength)) {
      DDecode[Slot]=Dist;
      DBits[Slot]=BitLength;
    }
  }
  
  let Bits;
  //tablesRead = false;

  rOldDist = [0,0,0,0]
  
  lastDist = 0;
  lastLength = 0;

  for (let i = UnpOldTable.length; i--;) {
    UnpOldTable[i] = 0;
  }
    
  // read in Huffman tables
  RarReadTables(bstream);
 
  while (true) {
    let num = RarDecodeNumber(bstream, LD);
    
    if (num < 256) {
      rBuffer.insertByte(num);
      continue;
    }
    if (num >= 271) {
      let Length = rLDecode[num -= 271] + 3;
      if ((Bits = rLBits[num]) > 0) {
        Length += bstream.readBits(Bits);
      }
      const DistNumber = RarDecodeNumber(bstream, DD);
      let Distance = DDecode[DistNumber] + 1;
      if ((Bits = DBits[DistNumber]) > 0) {
        if (DistNumber > 9) {
          if (Bits > 4) {
            Distance += ((bstream.getBits() >>> (20 - Bits)) << 4);
            bstream.readBits(Bits - 4);
            //todo: check this
          }
          if (lowDistRepCount > 0) {
            lowDistRepCount--;
            Distance += prevLowDist;
          } else {
            const LowDist = RarDecodeNumber(bstream, LDD);
            if (LowDist == 16) {
              lowDistRepCount = rLOW_DIST_REP_COUNT - 1;
              Distance += prevLowDist;
            } else {
              Distance += LowDist;
              prevLowDist = LowDist;
            }
          }
        } else {
          Distance += bstream.readBits(Bits);
        }
      }
      if (Distance >= 0x2000) {
        Length++;
        if (Distance >= 0x40000) {
          Length++;
        }
      }
      RarInsertOldDist(Distance);
      RarInsertLastMatch(Length, Distance);
      RarCopyString(Length, Distance);
      continue;
    }
    if (num == 256) {
      if (!RarReadEndOfBlock(bstream)) {
        break;
      }
      continue;
    }
    if (num == 257) {
      if (!RarReadVMCode(bstream)) {
        break;
      }
      continue;
    }
    if (num == 258) {
      if (lastLength != 0) {
        RarCopyString(lastLength, lastDist);
      }
      continue;
    }
    if (num < 263) {
      const DistNum = num - 259;
      const Distance = rOldDist[DistNum];

      for (let I = DistNum; I > 0; I--) {
        rOldDist[I] = rOldDist[I-1];
      }
      rOldDist[0] = Distance;

      const LengthNumber = RarDecodeNumber(bstream, RD);
      let Length = rLDecode[LengthNumber] + 2;
      if ((Bits = rLBits[LengthNumber]) > 0) {
        Length += bstream.readBits(Bits);
      }
      RarInsertLastMatch(Length, Distance);
      RarCopyString(Length, Distance);
      continue;
    }
    if (num < 272) {
      let Distance = rSDDecode[num -= 263] + 1;
      if ((Bits = rSDBits[num]) > 0) {
        Distance += bstream.readBits(Bits);
      }
      RarInsertOldDist(Distance);
      RarInsertLastMatch(2, Distance);
      RarCopyString(2, Distance);
      continue;
    }
  } // while (true)
  RarUpdateProgress();
  RarWriteBuf();
}

/**
 * Does stuff to the current byte buffer (rBuffer) based on
 * the filters loaded into the RarVM and writes out to wBuffer.
 */
function RarWriteBuf() {
  let writeSize = (rBuffer.ptr & MAXWINMASK);

  for (let i = 0; i < PrgStack.length; ++i) {
    const flt = PrgStack[i];
    if (flt == null) {
      continue;
    }

    if (flt.NextWindow) {
      flt.NextWindow = false;
      continue;
    }

    const blockStart = flt.BlockStart;
    const blockLength = flt.BlockLength;

    // WrittenBorder = wBuffer.ptr
    if (((blockStart - wBuffer.ptr) & MAXWINMASK) < writeSize) {
      if (wBuffer.ptr != blockStart) {
        // Copy blockStart bytes from rBuffer into wBuffer.
        RarWriteArea(wBuffer.ptr, blockStart);
        writeSize = (rBuffer.ptr - wBuffer.ptr) & MAXWINMASK;
      }
      if (blockLength <= writeSize) {
        const blockEnd = (blockStart + blockLength) & MAXWINMASK;
        if (blockStart < blockEnd || blockEnd == 0) {
          VM.setMemory(0, rBuffer.data.subarray(blockStart, blockStart + blockLength), blockLength);
        } else {
          const firstPartLength = MAXWINSIZE - blockStart;
          VM.setMemory(0, rBuffer.data.subarray(blockStart, blockStart + firstPartLength), firstPartLength);
          VM.setMemory(firstPartLength, rBuffer.data, blockEnd);
        }

        const parentPrg = Filters[flt.ParentFilter].Prg;
        const prg = flt.Prg;

        if (parentPrg.GlobalData.length > VM_FIXEDGLOBALSIZE) {
          // Copy global data from previous script execution if any.
          prg.GlobalData = new Uint8Array(parentPrg.GlobalData);
        }

        RarExecuteCode(prg);

        if (prg.GlobalData.length > VM_FIXEDGLOBALSIZE) {
          // Save global data for next script execution.
          const globalDataLen = prg.GlobalData.length;
          if (parentPrg.GlobalData.length < globalDataLen) {
            parentPrg.GlobalData = new Uint8Array(globalDataLen);
          }
          parentPrg.GlobalData.set(
              this.mem_.subarray(VM_FIXEDGLOBALSIZE, VM_FIXEDGLOBALSIZE + globalDataLen),
              VM_FIXEDGLOBALSIZE);
        } else {
          parentPrg.GlobalData = new Uint8Array(0);
        }

        let filteredData = prg.FilteredData;

        PrgStack[i] = null;
        while (i + 1 < PrgStack.length) {
          const nextFilter = PrgStack[i + 1];
          if (nextFilter == null || nextFilter.BlockStart != blockStart ||
              nextFilter.BlockLength != filteredData.length || nextFilter.NextWindow) {
            break;
          }

          // Apply several filters to same data block.

          VM.setMemory(0, filteredData, filteredData.length);

          const innerParentPrg = Filters[nextFilter.ParentFilter].Prg;
          const nextPrg = nextFilter.Prg;

          const globalDataLen = innerParentPrg.GlobalData.length;
          if (globalDataLen > VM_FIXEDGLOBALSIZE) {
            // Copy global data from previous script execution if any.
            nextPrg.GlobalData = new Uint8Array(globalDataLen);
            nextPrg.GlobalData.set(innerParentPrg.GlobalData.subarray(VM_FIXEDGLOBALSIZE, VM_FIXEDGLOBALSIZE + globalDataLen), VM_FIXEDGLOBALSIZE);
          }

          RarExecuteCode(nextPrg);

          if (nextPrg.GlobalData.length > VM_GLOBALMEMSIZE) {
            // Save global data for next script execution.
            const globalDataLen = nextPrg.GlobalData.length;
            if (innerParentPrg.GlobalData.length < globalDataLen) {
              innerParentPrg.GlobalData = new Uint8Array(globalDataLen);
            }
            innerParentPrg.GlobalData.set(
                this.mem_.subarray(VM_FIXEDGLOBALSIZE, VM_FIXEDGLOBALSIZE + globalDataLen),
                VM_FIXEDGLOBALSIZE);
          } else {
            innerParentPrg.GlobalData = new Uint8Array(0);
          }

          filteredData = nextPrg.FilteredData;
          i++;
          PrgStack[i] = null;
        } // while (i + 1 < PrgStack.length)

        for (let j = 0; j < filteredData.length; ++j) {
          wBuffer.insertByte(filteredData[j]);
        }
        writeSize = (rBuffer.ptr - wBuffer.ptr) & MAXWINMASK;
      } // if (blockLength <= writeSize)
      else {
        for (let j = i; j < PrgStack.length; ++j) {
          const theFlt = PrgStack[j];
          if (theFlt != null && theFlt.NextWindow) {
            theFlt.NextWindow = false;
          }
        }
        return;
      }
    } // if (((blockStart - wBuffer.ptr) & MAXWINMASK) < writeSize)
  } // for (let i = 0; i < PrgStack.length; ++i)

  // Write any remaining bytes from rBuffer to wBuffer;
  RarWriteArea(wBuffer.ptr, rBuffer.ptr);

  // Now that the filtered buffer has been written, swap it back to rBuffer.
  rBuffer = wBuffer;
}

/**
 * Copy bytes from rBuffer to wBuffer.
 * @param {number} startPtr The starting point to copy from rBuffer.
 * @param {number} endPtr The ending point to copy from rBuffer.
 */
function RarWriteArea(startPtr, endPtr) {
  if (endPtr < startPtr) {
    console.error('endPtr < startPtr, endPtr=' + endPtr + ', startPtr=' + startPtr);
//    RarWriteData(startPtr, -(int)StartPtr & MAXWINMASK);
//    RarWriteData(0, endPtr);
    return;
  } else if (startPtr < endPtr) {
    RarWriteData(startPtr, endPtr - startPtr);
  }
}

/**
 * Writes bytes into wBuffer from rBuffer.
 * @param {number} offset The starting point to copy bytes from rBuffer.
 * @param {number} numBytes The number of bytes to copy.
 */
function RarWriteData(offset, numBytes) {
  if (wBuffer.ptr >= rBuffer.data.length) {
    return;
  }
  const leftToWrite = rBuffer.data.length - wBuffer.ptr;
  if (numBytes > leftToWrite) {
    numBytes = leftToWrite;
  }
  for (let i = 0; i < numBytes; ++i) {
    wBuffer.insertByte(rBuffer.data[offset + i]);
  }
}

/**
 * @param {VM_PreparedProgram} prg
 */
function RarExecuteCode(prg)
{
  if (prg.GlobalData.length > 0) {
    const writtenFileSize = wBuffer.ptr;
    prg.InitR[6] = writtenFileSize;
    VM.setLowEndianValue(prg.GlobalData, writtenFileSize, 0x24);
    VM.setLowEndianValue(prg.GlobalData, (writtenFileSize >>> 32) >> 0, 0x28);
    VM.execute(prg);
  }
}

function RarReadEndOfBlock(bstream) {
  RarUpdateProgress();

  let NewTable = false;
  let NewFile = false;
  if (bstream.readBits(1)) {
    NewTable = true;
  } else {
    NewFile = true;
    NewTable = !!bstream.readBits(1);
  }
  //tablesRead = !NewTable;
  return !(NewFile || NewTable && !RarReadTables(bstream));
}

function RarInsertLastMatch(length, distance) {
  lastDist = distance;
  lastLength = length;
}

function RarInsertOldDist(distance) {
  rOldDist.splice(3,1);
  rOldDist.splice(0,0,distance);
}

/**
 * Copies len bytes from distance bytes ago in the buffer to the end of the
 * current byte buffer.
 * @param {number} length How many bytes to copy.
 * @param {number} distance How far back in the buffer from the current write
 *     pointer to start copying from.
 */
function RarCopyString(len, distance) {
  let srcPtr = rBuffer.ptr - distance;
  // If we need to go back to previous buffers, then seek back.
  if (srcPtr < 0) {
    let l = rOldBuffers.length;
    while (srcPtr < 0) {
      srcPtr = rOldBuffers[--l].data.length + srcPtr;
    }
    // TODO: lets hope that it never needs to read across buffer boundaries
    while (len--) {
      rBuffer.insertByte(rOldBuffers[l].data[srcPtr++]);
    }
  }
  if (len > distance) {
    while (len--) {
      rBuffer.insertByte(rBuffer.data[srcPtr++]);
    }
  } else {
    rBuffer.insertBytes(rBuffer.data.subarray(srcPtr, srcPtr + len));
  }
}

/**
 * @param {RarLocalFile} v
 */
function unpack(v) {
  // TODO: implement what happens when unpVer is < 15
  const Ver = v.header.unpVer <= 15 ? 15 : v.header.unpVer;
  const Solid = v.header.flags.LHD_SOLID;
  const bstream = new bitjs.io.BitStream(v.fileData.buffer, true /* rtl */, v.fileData.byteOffset, v.fileData.byteLength );

  rBuffer = new bitjs.io.ByteBuffer(v.header.unpackedSize);

  info("Unpacking " + v.filename + " RAR v" + Ver);

  switch (Ver) {
    case 15: // rar 1.5 compression
      Unpack15(bstream, Solid);
      break;
    case 20: // rar 2.x compression
    case 26: // files larger than 2GB
      Unpack20(bstream, Solid);
      break;
    case 29: // rar 3.x compression
    case 36: // alternative hash
      wBuffer = new bitjs.io.ByteBuffer(rBuffer.data.length);
      Unpack29(bstream, Solid);
      break;
  } // switch(method)

  rOldBuffers.push(rBuffer);
  // TODO: clear these old buffers when there's over 4MB of history
  return rBuffer.data;
}

/**
 */
class RarLocalFile {
  /**
   * @param {bitjs.io.BitStream} bstream
   */
  constructor(bstream) {
    this.header = new RarVolumeHeader(bstream);
    this.filename = this.header.filename;
    
    if (this.header.headType != FILE_HEAD && this.header.headType != ENDARC_HEAD) {
      this.isValid = false;
      info("Error! RAR Volume did not include a FILE_HEAD header ");
    }
    else {
      // read in the compressed data
      this.fileData = null;
      if (this.header.packSize > 0) {
        this.fileData = bstream.readBytes(this.header.packSize);
        this.isValid = true;
      }
    }
  }

  unrar() {
    if (!this.header.flags.LHD_SPLIT_BEFORE) {
      // unstore file
      if (this.header.method == 0x30) {
        info("Unstore "+this.filename);
        this.isValid = true;

        currentBytesUnarchivedInFile += this.fileData.length;
        currentBytesUnarchived += this.fileData.length;

        // Create a new buffer and copy it over.
        const len = this.header.packSize;
        const newBuffer = new bitjs.io.ByteBuffer(len);
        newBuffer.insertBytes(this.fileData);
        this.fileData = newBuffer.data;
      } else {
        this.isValid = true;
        this.fileData = unpack(this);
      }
    }
  }
}

const unrar = function(arrayBuffer) {
  currentFilename = "";
  currentFileNumber = 0;
  currentBytesUnarchivedInFile = 0;
  currentBytesUnarchived = 0;
  totalUncompressedBytesInArchive = 0;
  totalFilesInArchive = 0;

  postMessage(new bitjs.archive.UnarchiveStartEvent());
  const bstream = new bitjs.io.BitStream(arrayBuffer, false /* rtl */);
  
  const header = new RarVolumeHeader(bstream);
  if (header.crc == 0x6152 && 
    header.headType == 0x72 && 
    header.flags.value == 0x1A21 &&
    header.headSize == 7) {
    info("Found RAR signature");

    const mhead = new RarVolumeHeader(bstream);
    if (mhead.headType != MAIN_HEAD) {
      info("Error! RAR did not include a MAIN_HEAD header");
    }
    else {
      let localFiles = [];
      let localFile = null;
      do {
        try {
          localFile = new RarLocalFile(bstream);
          info("RAR localFile isValid=" + localFile.isValid + ", volume packSize=" + localFile.header.packSize);
          if (localFile && localFile.isValid && localFile.header.packSize > 0) {
            totalUncompressedBytesInArchive += localFile.header.unpackedSize;
            localFiles.push(localFile);
          } else if (localFile.header.packSize == 0 && localFile.header.unpackedSize == 0) {
            localFile.isValid = true;
          }
        } catch(err) {
          break;
        }
        //info("bstream" + bstream.bytePtr+"/"+bstream.bytes.length);
      } while (localFile.isValid);
      totalFilesInArchive = localFiles.length;
      
      // now we have all information but things are unpacked
      localFiles = localFiles.sort((a,b) => a.filename.toLowerCase() > b.filename.toLowerCase() ? 1 : -1);

      info(localFiles.map(function(a){return a.filename}).join(', '));
      for (let i = 0; i < localFiles.length; ++i) {
        const localfile = localFiles[i];
        
        // update progress 
        currentFilename = localfile.header.filename;
        currentBytesUnarchivedInFile = 0;
        
        // actually do the unzipping
        localfile.unrar();

        if (localfile.isValid) {
          postMessage(new bitjs.archive.UnarchiveExtractEvent(localfile));
          postProgress();
        }
      }
      
      postProgress();
    }
  }
  else {
    err("Invalid RAR file");
  }
  postMessage(new bitjs.archive.UnarchiveFinishEvent());
};

// event.data.file has the ArrayBuffer.
onmessage = function(event) {
  const ab = event.data.file;
  unrar(ab, true);
};
