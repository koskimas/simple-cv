const cv = require('./');
const os = require('os');
const fs = require('fs');
const path = require('path');
const expect = require('expect.js');

describe('simple-cv', () => {
  const invalidImagePath = __dirname + '/files/notanimage.jpg';

  const testImagePath = __dirname + '/files/test.jpg';
  const testImageWidth = 1280;
  const testImageHeight = 1024;

  const alphaImagePath = __dirname + '/files/alpha.png';
  const alphaImageWidth = 90;
  const alphaImageHeight = 75;

  describe('cv.Matrix', () => {

    it('should be able to create from an array data', () => {
      const matrix = new cv.Matrix({
        width: 3,
        height: 2,
        data: [1, 2, 3, 4, 5, 6]
      });

      expect(matrix.width).to.equal(3);
      expect(matrix.height).to.equal(2);
      expect(matrix.type).to.equal(cv.ImageType.Float);
      expect(matrix.toArray()).to.eql([1, 2, 3, 4, 5, 6]);
    });

    it('should be able to create from a matrix data', () => {
      const matrix = new cv.Matrix([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
        [0.7, 0.8, 0.9]
      ]);

      expect(matrix.width).to.equal(3);
      expect(matrix.height).to.equal(3);
      expect(matrix.type).to.equal(cv.ImageType.Float);
      expect(matrix.toArray()).to.eql([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
    });

    it('should be able to create from an array data with type', () => {
      const matrix = new cv.Matrix({
        width: 3,
        height: 2,
        data: [1, 2, 3, 4, 5, 300],
        type: cv.ImageType.Gray
      });

      expect(matrix.width).to.equal(3);
      expect(matrix.height).to.equal(2);
      expect(matrix.type).to.equal(cv.ImageType.Gray);
      expect(matrix.toArray()).to.eql([1, 2, 3, 4, 5, 44 /* overflow */]);
    });

    it('should be able to create from width and height', () => {
      const matrix = new cv.Matrix(10, 20);

      expect(matrix.width).to.equal(10);
      expect(matrix.height).to.equal(20);
      expect(matrix.type).to.equal(cv.ImageType.Gray);
    });

    it('should be able to create from width and height (object)', () => {
      const matrix = new cv.Matrix({width: 100, height: 50});

      expect(matrix.width).to.equal(100);
      expect(matrix.height).to.equal(50);
      expect(matrix.type).to.equal(cv.ImageType.Gray);
    });

    it('should be able to create from width, height and type', () => {
      const matrix = new cv.Matrix(10, 20, cv.ImageType.BGR);

      expect(matrix.width).to.equal(10);
      expect(matrix.height).to.equal(20);
      expect(matrix.type).to.equal(cv.ImageType.BGR);
    });

    it('should be able to create from width, height and type (object(', () => {
      const matrix = new cv.Matrix({width: 10, height: 20, type: cv.ImageType.BGR});

      expect(matrix.width).to.equal(10);
      expect(matrix.height).to.equal(20);
      expect(matrix.type).to.equal(cv.ImageType.BGR);
    });

    it('must provide width', () => {
      expect(() => {
        new cv.Matrix(undefined, 10);
      }).to.throwException(err => {
        expect(err.message).to.equal('expected either an object with a subset of fields {width, height, type?, data?} or arguments (width, height, type?)');
      });
    });

    it('must provide width (object)', () => {
      expect(() => {
        new cv.Matrix({
          height: 3
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('args.width and args.height must be integers');
      });
    });

    it('must provide height', () => {
      expect(() => {
        new cv.Matrix(10);
      }).to.throwException(err => {
        expect(err.message).to.equal('expected either an object with a subset of fields {width, height, type?, data?} or arguments (width, height, type?)');
      });
    });

    it('must provide height (object)', () => {
      expect(() => {
        new cv.Matrix({
          width: 3
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('args.width and args.height must be integers');
      });
    });

    it('data must contain width * height elements', () => {
      expect(() => {
        new cv.Matrix({
          width: 3,
          height: 2,
          data: [1, 2, 3, 4, 5]
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('args.data must contain args.width * args.height elements');
      });
    });

    it('all rows in the matrix constructor must have the same length', () => {
      expect(() => {
        new cv.Matrix([
          [0.1, 0.2, 0.3],
          [0.4, 0.5],
          [0.7, 0.8, 0.9]
        ]);
      }).to.throwException(err => {
        expect(err.message).to.equal('all rows must have the same length');
      });

      expect(() => {
        new cv.Matrix([
          [0.1, 0.2],
          [0.4, 0.5, 0.6],
          [0.7, 0.8, 0.9]
        ]);
      }).to.throwException(err => {
        expect(err.message).to.equal('all rows must have the same length');
      });
    });

    it('all items in the matrix constructor must be numbers', () => {
      expect(() => {
        new cv.Matrix([
          [0.1, 0.2, 0.3],
          [0.4, '0.5', 0.6],
          [0.7, 0.8, 0.9]
        ]);
      }).to.throwException(err => {
        expect(err.message).to.equal('all items in the arrays must be numbers');
      });
    });

    describe('Matrix.crop', () => {

      it('should create a new matrix from the subset of another one', () => {
        const matrix = new cv.Matrix([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]);

        return Promise.all([
          matrix.crop({x: 0, y: 0, width: 2, height: 3}),
          matrix.crop({x: 1, y: 2, width: 2, height: 1})
        ]).then(([res1, res2]) => {
          expect(res1.toArray()).to.eql([1, 2, 4, 5, 7, 8]);
          expect(res2.toArray()).to.eql([8, 9]);
        })
      });

      it('should fail gracefully if crop goes out of borders', () => {
        const matrix = new cv.Matrix([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]);

        return Promise.all([
          matrix.crop({x: 10, y: 1, width: 2, height: 2}).catch(err => err),
          matrix.crop({x: 0, y: 0, width: 4, height: 4}).catch(err => err),
          matrix.crop({x: 0, y: 0, width: 3, height: 3})
        ]).then(([err1, err2, image]) => {
          expect(err1).to.be.an(Error);
          expect(err2).to.be.an(Error);
          expect(err1.message).to.equal('crop (x=10..12, y=1..3) goes outside the matrix bounds (w=3, h=3)');
          expect(err2.message).to.equal('crop (x=0..4, y=0..4) goes outside the matrix bounds (w=3, h=3)');
          expect(image).to.be.a(cv.Matrix);
        });
      });

    });

    describe('Matrix.set', () => {

      it('should set a sub region of a matrix', () => {
        const target = new cv.Matrix([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]);

        const source = new cv.Matrix([
          [11, 22],
          [33, 44],
        ]);

        return target.set(source, {x: 1, y: 0}).then(target => {
          expect(target.toArray()).to.eql([
            1, 11, 22,
            4, 33, 44,
            7, 8,  9
          ]);

          return target.set(source, {x: 0, y: 1});
        }).then(target => {
          expect(target.toArray()).to.eql([
            1,  11, 22,
            11, 22, 44,
            33, 44,  9
          ]);

          return target.set(source, {x: 1, y: 1});
        }).then(target => {
          expect(target.toArray()).to.eql([
            1,  11, 22,
            11, 11, 22,
            33, 33, 44
          ]);
        });
      });

      it('should fail gracefully if the set goes out of borders', (done) => {
        const target = new cv.Matrix([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]);

        const source = new cv.Matrix([
          [11, 22],
          [33, 44],
        ]);

        target.set(source, {x: 2, y: 2}).then(() => {
          done(new Error('should not get here'));
        }).catch(err => {
          expect(err.message).to.equal('set (x=2..4, y=2..4) goes outside the matrix bounds (w=3, h=3)');
          done();
        }).catch(done);
      });

    });

    describe('Matrix.toBuffers', () => {

      it('should return an array with data buffer for each channel', () => {
        return Promise.all([
          cv.readImage(testImagePath),
          cv.readImage(alphaImagePath),
          cv.matrix([[1, 2], [3, 4]]),
          cv.matrix({width: 2, height: 2, data: [5, 6, 7, 8], type: cv.ImageType.Gray})
        ]).then(([bgr, bgra, float, gray]) => {
          let buffers = bgr.toBuffers();
          expect(buffers).to.have.length(3);
          expect(buffers.find(it => it.channel == cv.Channel.Blue).data.length).to.equal(testImageHeight * testImageWidth);
          expect(buffers.find(it => it.channel == cv.Channel.Green).data.length).to.equal(testImageHeight * testImageWidth);
          expect(buffers.find(it => it.channel == cv.Channel.Red).data.length).to.equal(testImageHeight * testImageWidth);

          buffers = bgra.toBuffers();
          expect(buffers).to.have.length(4);
          expect(buffers.find(it => it.channel == cv.Channel.Blue).data.length).to.equal(alphaImageHeight * alphaImageWidth);
          expect(buffers.find(it => it.channel == cv.Channel.Green).data.length).to.equal(alphaImageHeight * alphaImageWidth);
          expect(buffers.find(it => it.channel == cv.Channel.Red).data.length).to.equal(alphaImageHeight * alphaImageWidth);
          expect(buffers.find(it => it.channel == cv.Channel.Alpha).data.length).to.equal(alphaImageHeight * alphaImageWidth);

          buffers = float.toBuffers();
          expect(buffers).to.have.length(1);
          expect(buffers.find(it => it.channel == cv.Channel.Float).data.length).to.equal(4);

          buffers = gray.toBuffers();
          expect(buffers).to.have.length(1);
          expect(buffers.find(it => it.channel == cv.Channel.Gray).data.length).to.equal(4);
          expect(buffers[0].data[0]).to.equal(5);
          expect(buffers[0].data[1]).to.equal(6);
          expect(buffers[0].data[2]).to.equal(7);
          expect(buffers[0].data[3]).to.equal(8);
        });
      });

    });

  });

  describe('cv.readImage', () => {

    it('should read an image', () => {
      return cv.readImage(testImagePath).then(matrix => {
        expect(matrix.width).to.equal(testImageWidth);
        expect(matrix.height).to.equal(testImageHeight);
        expect(matrix.type).to.be.a('number');
        expect(matrix.type).to.equal(cv.ImageType.BGR);

        if (process.env.SHOW_IMAGES) {
          cv.showImage("color image", matrix);
          cv.waitKey();
        }
      });
    });

    it('should read an image with alpha channel', () => {
      return cv.readImage(alphaImagePath).then(matrix => {
        expect(matrix.width).to.equal(alphaImageWidth);
        expect(matrix.height).to.equal(alphaImageHeight);
        expect(matrix.type).to.be.a('number');
        expect(matrix.type).to.equal(cv.ImageType.BGRA);

        if (process.env.SHOW_IMAGES) {
          cv.showImage("color image", matrix);
          cv.waitKey();
        }
      });
    });

    it('should read a grayscale image', () => {
      return cv.readImage(testImagePath, cv.ImageType.Gray).then(matrix => {
        expect(matrix.width).to.equal(testImageWidth);
        expect(matrix.height).to.equal(testImageHeight);
        expect(matrix.type).to.be.a('number');
        expect(matrix.type).to.equal(cv.ImageType.Gray);

        if (process.env.SHOW_IMAGES) {
          cv.showImage("gray image", matrix);
          cv.waitKey();
        }
      });
    });

    it('should fail if trying to read an invalid or unsupported image', (done) => {
      cv.readImage(invalidImagePath).then(() => {
        done(new Error('should not get here'));
      }).catch(err => {
        expect(err.message).to.equal(`invalid image file "${invalidImagePath}"`);
        done();
      }).catch(done);
    });

  });

  describe('cv.decodeImage', () => {

    it('should decode an image', () => {
      const mat = cv.matrix([
        [10, 20, 30],
        [40, 50, 60]
      ]);

      return cv.encodeImage(mat, cv.EncodeType.PNG).then(buffer => {
        expect(Buffer.isBuffer(buffer)).to.equal(true);
        return cv.decodeImage(buffer, cv.ImageType.Gray);
      }).then(image => {
        expect(image.toArray()).to.eql([10, 20, 30, 40, 50, 60]);
      });
    });

    it('should decode an image with an alpha channel', () => {
      const buffer = fs.readFileSync(alphaImagePath);

      return cv.decodeImage(buffer).then(image => {
        expect(image.width).to.equal(alphaImageWidth);
        expect(image.height).to.equal(alphaImageHeight);
        expect(image.type).to.equal(cv.ImageType.BGRA);
      });
    });

  });

  describe('cv.writeImage', () => {
    const filePath = path.join(os.tmpdir(), 'tmp.png');

    beforeEach(() => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    it('should write an image', () => {
      const filePath = path.join(os.tmpdir(), 'tmp.png');
      const mat = new cv.Matrix([
        [10, 20, 30],
        [40, 50, 60]
      ]);

      return cv.writeImage(mat, filePath).then(() => {
        expect(fs.existsSync(filePath)).to.equal(true);
        return cv.readImage(filePath, cv.ImageType.Gray);
      }).then(image => {
        expect(image.toArray()).to.eql([10, 20, 30, 40, 50, 60]);
      });
    });

    it('should write an image with an alpha channel', () => {
      return cv.readImage(alphaImagePath).then(image => {
        return cv.writeImage(image, filePath);
      }).then(() => {
        return cv.readImage(filePath);
      }).then(image => {
        expect(image.width).to.equal(alphaImageWidth);
        expect(image.height).to.equal(alphaImageHeight);
        expect(image.type).to.equal(cv.ImageType.BGRA);
      });
    });

  });

  describe('cv.encodeImage', () => {

    it('should encode an image', () => {
      const filePath = path.join(os.tmpdir(), 'tmp.jpg');

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return cv.readImage(testImagePath).then(image => {
        return Promise.all([
          cv.encodeImage(image, cv.EncodeType.JPEG),
          cv.writeImage(image, filePath)
        ]).then(([buffer]) => {
          expect(buffer.equals(fs.readFileSync(filePath))).to.equal(true);
        });
      });

    });

  });

  describe('cv.resize', () => {

    it('should resize image to width preserving aspect ratio', () => {
      return cv.readImage(testImagePath).then(matrix => {
        return Promise.all([
          cv.resize(matrix, testImageWidth / 2),
          cv.resize(matrix, testImageWidth / 2),
          cv.resize(matrix, testImageWidth / 2),
          cv.resize(matrix, testImageWidth / 2),
          cv.resize(matrix, testImageWidth / 2),
          cv.resize(matrix, testImageWidth / 2),
          cv.resize(matrix, testImageWidth / 2),
          cv.resize(matrix, testImageWidth / 2)
        ])
      }).then(([matrix]) => {
        expect(matrix.width).to.equal(testImageWidth / 2);
        expect(matrix.height).to.equal(testImageHeight / 2);
        expect(matrix.type).to.equal(cv.ImageType.BGR);

        if (process.env.SHOW_IMAGES) {
          cv.showImage("resized image", matrix);
          cv.waitKey();
        }
      });
    });

    it('should resize gray image to width preserving aspect ratio', () => {
      return cv.readImage(testImagePath, cv.ImageType.Gray).then(matrix => {
        return cv.resize(matrix, testImageWidth / 2);
      }).then(matrix => {
        expect(matrix.width).to.equal(testImageWidth / 2);
        expect(matrix.height).to.equal(testImageHeight / 2);
        expect(matrix.type).to.equal(cv.ImageType.Gray);

        if (process.env.SHOW_IMAGES) {
          cv.showImage("gray resized image", matrix);
          cv.waitKey();
        }
      });
    });

    it('should resize image to width preserving aspect ratio', () => {
      return cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, {width: testImageWidth / 4});
      }).then(matrix => {
        expect(matrix.width).to.equal(testImageWidth / 4);
        expect(matrix.height).to.equal(testImageHeight / 4);
        expect(matrix.type).to.equal(cv.ImageType.BGR);
      });
    });

    it('should resize image to height preserving aspect ratio', () => {
      return cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, {height: testImageHeight / 4});
      }).then(matrix => {
        expect(matrix.width).to.equal(testImageWidth / 4);
        expect(matrix.height).to.equal(testImageHeight / 4);
        expect(matrix.type).to.equal(cv.ImageType.BGR);
      });
    });

    it('should resize image to scale preserving aspect ratio', () => {
      return cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, {scale: 0.5});
      }).then(matrix => {
        expect(matrix.width).to.equal(testImageWidth / 2);
        expect(matrix.height).to.equal(testImageHeight / 2);
        expect(matrix.type).to.equal(cv.ImageType.BGR);
      });
    });

    it('should resize image to scale', () => {
      return cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, {xScale: 0.5, yScale: 0.25});
      }).then(matrix => {
        expect(matrix.width).to.equal(testImageWidth / 2);
        expect(matrix.height).to.equal(testImageHeight / 4);
        expect(matrix.type).to.equal(cv.ImageType.BGR);
      });
    });

    it('should resize image to size', () => {
      return cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, {width: 128, height: 200});
      }).then(matrix => {
        expect(matrix.width).to.equal(128);
        expect(matrix.height).to.equal(200);
        expect(matrix.type).to.equal(cv.ImageType.BGR);
      });
    });

    it('should fail if no second argument is given', (done) => {
      cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix);
      }).then(() => {
        done(new Error('should not get here'));
      }).catch(err => {
        expect(err.message).to.equal('second argument (sizeSpec) must be an integer or an object');
        done();
      }).catch(done);
    });

    it('should fail if an empty object is given', (done) => {
      cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, {});
      }).then(() => {
        done(new Error('should not get here'));
      }).catch(err => {
        expect(err.message).to.equal('second argument (sizeSpec) must be a valid sizeSpec object');
        done();
      }).catch(done);
    });

    it('should fail if a string is given', (done) => {
      cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, 'balls');
      }).then(() => {
        done(new Error('should not get here'));
      }).catch(err => {
        expect(err.message).to.equal('second argument (sizeSpec) must be an integer or an object');
        done();
      }).catch(done);
    });

    it('should fail if only xScale is given', (done) => {
      cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, {xScale: 2});
      }).then(() => {
        done(new Error('should not get here'));
      }).catch(err => {
        expect(err.message).to.equal('second argument (sizeSpec) must be a valid sizeSpec object');
        done();
      }).catch(done);
    });

    it('should fail if only yScale is given', (done) => {
      cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, {yScale: 2});
      }).then(() => {
        done(new Error('should not get here'));
      }).catch(err => {
        expect(err.message).to.equal('second argument (sizeSpec) must be a valid sizeSpec object');
        done();
      }).catch(done);
    });

    it('should fail with invalid width', (done) => {
      cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, 0);
      }).then(() => {
        done(new Error('should not get here'));
      }).catch(err => {
        expect(err.message).to.equal('if the second argument (sizeSpec) is a number it must be a positive integer');
        done();
      }).catch(done);
    });

    it('should fail with invalid width (object version)', (done) => {
      cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, {width: -1});
      }).then(() => {
        done(new Error('should not get here'));
      }).catch(err => {
        expect(err.message).to.equal('width must be a positive integer');
        done();
      }).catch(done);
    });

    it('should fail with invalid scale', (done) => {
      cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, {scale: -10});
      }).then(() => {
        done(new Error('should not get here'));
      }).catch(err => {
        expect(err.message).to.equal('scale must be positive floating point number');
        done();
      }).catch(done);
    });

    it('should fail with invalid xScale', (done) => {
      cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, {xScale: 0, yScale: 1});
      }).then(() => {
        done(new Error('should not get here'));
      }).catch(err => {
        expect(err.message).to.equal('xScale and yScale must be positive floating point numbers');
        done();
      }).catch(done);
    });

    it('should fail with invalid yScale', (done) => {
      cv.readImage(testImagePath).then(matrix => {
        return cv.resize(matrix, {xScale: 1, yScale: -1});
      }).then(() => {
        done(new Error('should not get here'));
      }).catch(err => {
        expect(err.message).to.equal('xScale and yScale must be positive floating point numbers');
        done();
      }).catch(done);
    });

  });

  describe('warpAffine', () => {

    it('should transform an image', () => {
      const matrix = cv.matrix([
        [1, 2, 0],
        [3, 4, 0],
        [0, 0, 0]
      ]);

      const transpose = cv.matrix([
        [0, 1, 0],
        [1, 0, 0]
      ]);

      // Test a simple transpose transformation.
      return cv.warpAffine(matrix, transpose).then(image => {
        expect(image.toArray()).to.eql([
          1, 3, 0,
          2, 4, 0,
          0, 0, 0
        ]);
      });
    });

    it('should accept options object', () => {
      const matrix = cv.matrix([
        [1, 2, 0],
        [3, 4, 0],
        [0, 0, 0]
      ]);

      const rot = cv.rotationMatrix({x: 0, y: 0}, 90);

      return Promise.all([
        cv.warpAffine(matrix, rot, {borderType: cv.BorderType.Replicate}).then(image => {
          expect(image.toArray()).to.eql([
            1, 3, 0,
            1, 3, 0,
            1, 3, 0
          ]);
        }),
        cv.warpAffine(matrix, rot, {borderType: cv.BorderType.Constant, borderValue: 5}).then(image => {
          expect(image.toArray()).to.eql([
            1, 3, 0,
            5, 5, 5,
            5, 5, 5
          ]);
        })
      ])
    });

  });

  describe('rotationMatrix', () => {

    it('should create an affine rotation transformation matrix', () => {
      const matrix = cv.matrix([
        [1, 2, 0],
        [3, 4, 0],
        [0, 0, 0]
      ]);

      const rotation = cv.rotationMatrix({x: 1, y: 1}, 90);

      // Test a simple flip transformation.
      return cv.warpAffine(matrix, rotation).then(image => {
        expect(image.toArray()).to.eql([
          0, 0, 0,
          2, 4, 0,
          1, 3, 0
        ]);
      });
    });

  });

  describe('rotate', () => {

    it('should rotate an image', () => {
      const matrix = cv.matrix([
        [1, 2, 0],
        [3, 4, 0],
        [0, 0, 0]
      ]);

      return cv.rotate(matrix, 90).then(image => {
        expect(image.toArray()).to.eql([
          0, 0, 0,
          2, 4, 0,
          1, 3, 0
        ]);
      });
    });

    it('should accept an options object', () => {
      const matrix = cv.matrix([
        [1, 2, 0],
        [3, 4, 0],
        [0, 0, 0]
      ]);

      return cv.rotate(matrix, {angle: 90, xCenter: 0, yCenter: 1}).then(image => {
        expect(image.toArray()).to.eql([
          4, 0, 0,
          3, 0, 0,
          0, 0, 0
        ]);
      });
    });

  });

  describe('flipLeftRight', () => {

    it('should flip an image', () => {
      const matrix = cv.matrix([
        [1, 2, 0],
        [3, 4, 0],
        [0, 0, 0]
      ]);

      return cv.flipLeftRight(matrix).then(matrix => {
        expect(matrix.toArray()).to.eql([
          0, 2, 1,
          0, 4, 3,
          0, 0, 0
        ]);
      });
    });

  });

  describe('flipUpDown', () => {

    it('should flip an image', () => {
      const matrix = cv.matrix([
        [1, 2, 0],
        [3, 4, 0],
        [0, 0, 0]
      ]);

      return cv.flipUpDown(matrix).then(matrix => {
        expect(matrix.toArray()).to.eql([
          0, 0, 0,
          3, 4, 0,
          1, 2, 0
        ]);
      });
    });

  });

});