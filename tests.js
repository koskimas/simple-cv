const _ = require('lodash');
const cv = require('./');
const os = require('os');
const fs = require('fs');
const path = require('path');
const expect = require('expect.js');
const spline = require('cubic-spline');

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
        expect(err.message).to.equal('args.data must contain args.width * args.height * channels elements');
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

    describe('Matrix.cropSync', () => {

      it('should create a new matrix from the subset of another one', () => {
        const matrix = new cv.Matrix([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]);

        const res1 = matrix.cropSync({x: 0, y: 0, width: 2, height: 3});
        const res2 = matrix.cropSync({x: 1, y: 2, width: 2, height: 1});
        const res3 = matrix.cropSync({x: 0, y: 0, width: 3, height: 3})

        expect(res1.toArray()).to.eql([1, 2, 4, 5, 7, 8]);
        expect(res2.toArray()).to.eql([8, 9]);
        expect(res3.toArray()).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });

      it('should fail gracefully if crop goes out of borders', () => {
        const matrix = new cv.Matrix([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]);

        expect(() => {
          matrix.cropSync({x: 10, y: 1, width: 2, height: 2})
        }).to.throwException(err => {
          expect(err.message).to.equal('crop (x=10..12, y=1..3) goes outside the matrix bounds (w=3, h=3)');
        });

        expect(() => {
          matrix.cropSync({x: 0, y: 0, width: 4, height: 4})
        }).to.throwException(err => {
          expect(err.message).to.equal('crop (x=0..4, y=0..4) goes outside the matrix bounds (w=3, h=3)');
        });
      });

    });

    describe('Matrix.clone', () => {

      it('should clone a matrix', () => {
        const target = new cv.Matrix([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]);

        const source = new cv.Matrix([
          [11, 22],
          [33, 44],
        ]);

        const clone = target.clone();

        expect(clone.width).to.equal(target.width);
        expect(clone.height).to.equal(target.height);
        expect(clone.type).to.equal(target.type);

        clone.setSync(source, {x: 1, y: 0});

        expect(clone.toArray()).to.eql([
          1, 11, 22,
          4, 33, 44,
          7, 8,  9
        ]);

        expect(target.toArray()).to.eql([
          1, 2, 3,
          4, 5, 6,
          7, 8, 9
        ]);
      });

    });

    describe('Matrix.add', () => {

      it('should add a number', () => {
        const target = cv.matrix([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]);

        return target.add(1.5).then(result => {
          expect(result.toArray()).to.eql([
            2.5, 3.5, 4.5,
            5.5, 6.5, 7.5,
            8.5, 9.5, 10.5
          ]);
        });
      });

      it('should add a number to a grayscale matrix', () => {
        const target = cv.matrix({
          width: 3,
          height: 3,
          type: cv.ImageType.Gray,
          data: [
            1, 2, 3,
            4, 5, 6,
            7, 8, 9
          ]
        });

        return target.add(1.4).then(result => {
          expect(result.toArray()).to.eql([
            2, 3, 4,
            5, 6, 7,
            8, 9, 10
          ]);
        });
      });

      it('should add a matrix', () => {
        const target = cv.matrix([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]);

        const other = cv.matrix([
          [1, 1, 1],
          [2, 2, 2],
          [3, 3, 3]
        ]);

        return target.add(other).then(result => {
          expect(result.toArray()).to.eql([
            2,  3,  4,
            6,  7,  8,
            10, 11, 12
          ]);
        });
      });

      describe('Matrix.addSync', () => {

        it('should add a number', () => {
          let target = cv.matrix([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
          ]);

          const result = target.addSync(1.5);

          expect(result).to.equal(target);
          expect(result.toArray()).to.eql([
            2.5, 3.5, 4.5,
            5.5, 6.5, 7.5,
            8.5, 9.5, 10.5
          ]);
        });

      });

      describe('Matrix.mul', () => {

        it('should multiply by a number', () => {
          const target = cv.matrix([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
          ]);

          return target.mul(1.5).then(result => {
            expect(result.toArray()).to.eql([
              1.5,  3,   4.5,
              6,    7.5, 9,
              10.5, 12,  13.5
            ]);
          });
        });

        it('should multiply a grayscale matrix by a number', () => {
          const target = cv.matrix({
            width: 3,
            height: 3,
            type: cv.ImageType.Gray,
            data: [
              1, 2, 3,
              4, 5, 6,
              7, 8, 9
            ]
          });

          return target.mul(1.6).then(result => {
            expect(result.toArray()).to.eql([
              2,  3,  5,
              6,  8,  10,
              11, 13, 14
            ]);
          });
        });

        it('should multiply by a matrix', () => {
          const target = cv.matrix([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
          ]);

          const other = cv.matrix([
            [1, 1, 1],
            [2, 2, 2],
            [3, 3, 3]
          ]);

          return target.mul(other).then(result => {
            expect(result.toArray()).to.eql([
              1,  2,  3,
              8,  10, 12,
              21, 24, 27
            ]);
          });
        });

      });

      describe('Matrix.mulSync', () => {

        it('should multiply by a number', () => {
          const target = cv.matrix([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
          ]);

          const result = target.mulSync(1.5);

          expect(result).to.equal(target);
          expect(result.toArray()).to.eql([
            1.5,  3,   4.5,
            6,    7.5, 9,
            10.5, 12,  13.5
          ]);
        });

      });

      it('should multiply by a color', () => {
        const target = cv.matrix({
          width: 3,
          height: 3,
          type: cv.ImageType.BGR,
          data: [
            1, 1, 1,
            2, 2, 2,
            3, 3, 3,

            4, 4, 4,
            5, 5, 5,
            6, 6, 6,

            7, 7, 7,
            8, 8, 8,
            9, 9, 9,
          ]
        });

        return target.mul({blue: 2, green: 3, red: 0.6}).then(result => {
          expect(result.toArray()).to.eql([
            2, 2, 2,
            4, 4, 4,
            6, 6, 6,

            12, 12, 12,
            15, 15, 15,
            18, 18, 18,

            4, 4, 4,
            5, 5, 5,
            5, 5, 5,
          ]);
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

    describe('Matrix.setSync', () => {

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

        target.setSync(source, {x: 1, y: 0});
        expect(target.toArray()).to.eql([
          1, 11, 22,
          4, 33, 44,
          7, 8,  9
        ]);

        target.setSync(source, {x: 0, y: 1});
        expect(target.toArray()).to.eql([
          1,  11, 22,
          11, 22, 44,
          33, 44,  9
        ]);

        target.setSync(source, {x: 1, y: 1});
        expect(target.toArray()).to.eql([
          1,  11, 22,
          11, 11, 22,
          33, 33, 44
        ]);
      });

      it('should fail gracefully if the set goes out of borders', () => {
        const target = new cv.Matrix([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]);

        const source = new cv.Matrix([
          [11, 22],
          [33, 44],
        ]);

        expect(() => {
          target.setSync(source, {x: 2, y: 2});
        }).to.throwException(err => {
          expect(err.message).to.equal('set (x=2..4, y=2..4) goes outside the matrix bounds (w=3, h=3)');
        });
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
          expect(buffers.find(it => it.channel == cv.Channel.Float).data.length).to.equal(4 * 8);
          expect(buffers.find(it => it.channel == cv.Channel.Float).data.readDoubleLE(0)).to.equal(1);
          expect(buffers.find(it => it.channel == cv.Channel.Float).data.readDoubleLE(16)).to.equal(3);

          buffers = gray.toBuffers();
          expect(buffers).to.have.length(1);
          expect(buffers.find(it => it.channel == cv.Channel.Gray).data.length).to.equal(4);
          expect(buffers[0].data[0]).to.equal(5);
          expect(buffers[0].data[1]).to.equal(6);
          expect(buffers[0].data[2]).to.equal(7);
          expect(buffers[0].data[3]).to.equal(8);
        });
      });

      it('should work with BGR data', () => {
        const matrix = cv.matrix({
          width: 3,
          height: 3,
          type: cv.ImageType.BGR,
          data: [
            1, 1, 1,
            2, 2, 2,
            3, 3, 3,

            4, 4, 4,
            5, 5, 5,
            6, 6, 6,

            7, 7, 7,
            8, 8, 8,
            9, 9, 9
          ]
        });

        const [b, g, r] = matrix.toBuffers().map(it => it.data);

        expect(_.range(b.length).map(it => b[it])).eql([1, 1, 1, 2, 2, 2, 3, 3, 3]);
        expect(_.range(g.length).map(it => g[it])).eql([4, 4, 4, 5, 5, 5, 6, 6, 6]);
        expect(_.range(r.length).map(it => r[it])).eql([7, 7, 7, 8, 8, 8, 9, 9, 9]);
      });

    });

  });

  describe('Matrix.toBuffer', () => {

    it('should return the matrix data as a single buffer', () => {
      const matrix = cv.matrix({width: 2, height: 2, data: [5, 6, 7, 8], type: cv.ImageType.Gray});
      const buffer = matrix.toBuffer();

      expect(buffer.length).to.equal(4);
      expect(buffer[0]).to.equal(5);
      expect(buffer[1]).to.equal(6)
      expect(buffer[2]).to.equal(7)
      expect(buffer[3]).to.equal(8)
    });

    it('should work with BGR data', () => {
      const matrix = cv.matrix({
        width: 3,
        height: 3,
        type: cv.ImageType.BGR,
        data: [
          1, 1, 1,
          2, 2, 2,
          3, 3, 3,

          4, 4, 4,
          5, 5, 5,
          6, 6, 6,

          7, 7, 7,
          8, 8, 8,
          9, 9, 9
        ]
      });

      const data = matrix.toBuffer();

      expect(_.range(data.length).map(it => data[it])).eql([
        1, 4, 7, 1, 4, 7, 1, 4, 7,
        2, 5, 8, 2, 5, 8, 2, 5, 8,
        3, 6, 9, 3, 6, 9, 3, 6, 9
      ]);
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

  describe('cv.readImageSync', () => {

    it('should read an image', () => {
      const matrix = cv.readImageSync(testImagePath);

      expect(matrix.width).to.equal(testImageWidth);
      expect(matrix.height).to.equal(testImageHeight);
      expect(matrix.type).to.be.a('number');
      expect(matrix.type).to.equal(cv.ImageType.BGR);
    });

    it('should read an image with alpha channel', () => {
      const matrix = cv.readImageSync(alphaImagePath);

      expect(matrix.width).to.equal(alphaImageWidth);
      expect(matrix.height).to.equal(alphaImageHeight);
      expect(matrix.type).to.be.a('number');
      expect(matrix.type).to.equal(cv.ImageType.BGRA);
    });

    it('should read a grayscale image', () => {
      const matrix =  cv.readImageSync(testImagePath, cv.ImageType.Gray);

      expect(matrix.width).to.equal(testImageWidth);
      expect(matrix.height).to.equal(testImageHeight);
      expect(matrix.type).to.be.a('number');
      expect(matrix.type).to.equal(cv.ImageType.Gray);
    });

    it('should fail if trying to read an invalid or unsupported image', () => {
      expect(() => {
        cv.readImageSync(invalidImagePath);
      }).to.throwException(err => {
        expect(err.message).to.equal(`invalid image file "${invalidImagePath}"`);
      });
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

    it('should fail if the first argument is not a buffer', (done) => {
      cv.decodeImage([])
        .then(() => done(new Error('should not get here')))
        .catch(err => {
          expect(err.message).to.equal('first argument (data) must be a Buffer');
          done();
        })
        .catch(done);
    });

    it('should fail if the second argument is an invalid ImageType', (done) => {
      const buffer = fs.readFileSync(alphaImagePath);

      cv.decodeImage(buffer, 666)
        .then(() => done(new Error('should not get here')))
        .catch(err => {
          expect(err.message).to.equal('second argument (decodeType) must be a one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.BGRA]');
          done();
        })
        .catch(done);
    });

    it('should fail if too many arguments are given', (done) => {
      const buffer = fs.readFileSync(alphaImagePath);

      cv.decodeImage(buffer, cv.ImageType.Gray, null)
        .then(() => done(new Error('should not get here')))
        .catch(err => {
          expect(err.message).to.equal('expected at least one argument (data) and at most three arguments (data, decodeType, callback)');
          done();
        })
        .catch(done);
    });

    it('should fail if invalid image data is given', (done) => {
      const buffer = fs.readFileSync(alphaImagePath);

      cv.decodeImage(Buffer.allocUnsafe(1234))
        .then(() => done(new Error('should not get here')))
        .catch(err => {
          expect(err.message).to.equal('invalid image data');
          done();
        })
        .catch(done);
    });

  });

  describe('cv.decodeImageSync', () => {

    it('should decode an image', () => {
      const mat = cv.matrix([
        [10, 20, 30],
        [40, 50, 60]
      ]);

      return cv.encodeImage(mat, cv.EncodeType.PNG).then(buffer => {
        expect(Buffer.isBuffer(buffer)).to.equal(true);
        const image = cv.decodeImageSync(buffer, cv.ImageType.Gray);
        expect(image.toArray()).to.eql([10, 20, 30, 40, 50, 60]);
      });
    });

    it('should decode an image with an alpha channel', () => {
      const buffer = fs.readFileSync(alphaImagePath);
      const image = cv.decodeImageSync(buffer);
      expect(image.width).to.equal(alphaImageWidth);
      expect(image.height).to.equal(alphaImageHeight);
      expect(image.type).to.equal(cv.ImageType.BGRA);
    });

    it('should fail if the first argument is not a buffer', () => {
      expect(() => {
        cv.decodeImageSync([])
      }).to.throwException(err => {
        expect(err.message).to.equal('first argument (data) must be a Buffer');
      });
    });

    it('should fail if the second argument is an invalid ImageType', () => {
      const buffer = fs.readFileSync(alphaImagePath);

      expect(() => {
        cv.decodeImageSync(buffer, 666)
      }).to.throwException(err => {
        expect(err.message).to.equal('second argument (decodeType) must be a one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.BGRA]');
      });
    });

    it('should fail if too many arguments are given', () => {
      const buffer = fs.readFileSync(alphaImagePath);

      expect(() => {
        cv.decodeImageSync(buffer, cv.ImageType.Gray, null)
      }).to.throwException(err => {
        expect(err.message).to.equal('third argument (callback) must be a function');
      });
    });

    it('should fail if invalid image data is given', () => {
      expect(() => {
        cv.decodeImageSync(Buffer.allocUnsafe(1234))
      }).to.throwException(err => {
        expect(err.message).to.equal('invalid image data');
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

  describe('cv.writeImageSync', () => {
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

      cv.writeImageSync(mat, filePath);
      const image = cv.readImageSync(filePath, cv.ImageType.Gray);
      expect(image.toArray()).to.eql([10, 20, 30, 40, 50, 60]);
    });

    it('should write an image with an alpha channel', () => {
      cv.writeImageSync(cv.readImageSync(alphaImagePath), filePath);
      const image = cv.readImageSync(filePath);

      expect(image.width).to.equal(alphaImageWidth);
      expect(image.height).to.equal(alphaImageHeight);
      expect(image.type).to.equal(cv.ImageType.BGRA);
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

    it('should fail if the first argument is not a matrix', (done) => {
      cv.encodeImage({}, cv.EncodeType.JPEG)
        .then(() => done(new Error('should not get here')))
        .catch(err => {
          expect(err.message).to.equal('first argument (image) must be a Matrix');
          done();
        })
        .catch(done)
    });

    it('should fail if the second argument is not a cv.EncodeType (1)', (done) => {
      cv.encodeImage(cv.matrix([[1, 2, 3, 4], [5, 6, 7, 8]]), 'png')
        .then(() => done(new Error('should not get here')))
        .catch(err => {
          expect(err.message).to.equal('second argument (type) must be one of [cv.EncodeType.JPEG, cv.EncodeType.PNG]');
          done();
        })
        .catch(done)
    });

    it('should fail if the second argument is not a cv.EncodeType (2)', (done) => {
      cv.encodeImage(cv.matrix([[1, 2, 3, 4], [5, 6, 7, 8]]), 666)
        .then(() => done(new Error('should not get here')))
        .catch(err => {
          expect(err.message).to.equal('second argument (type) must be one of [cv.EncodeType.JPEG, cv.EncodeType.PNG]');
          done();
        })
        .catch(done)
    });

  });

  describe('cv.encodeImageSync', () => {

    it('should encode an image', () => {
      const filePath = path.join(os.tmpdir(), 'tmp.jpg');

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return cv.readImage(testImagePath).then(image => {
        const buffer = cv.encodeImageSync(image, cv.EncodeType.JPEG);

        return cv.writeImage(image, filePath).then(() => {
          expect(buffer.equals(fs.readFileSync(filePath))).to.equal(true);
        });
      });

    });

    it('should fail if the first argument is not a matrix', () => {
      expect(() => {
        cv.encodeImageSync({}, cv.EncodeType.JPEG);
      }).to.throwException(err => {
        expect(err.message).to.equal('first argument (image) must be a Matrix');
      });
    });

    it('should fail if the second argument is not a cv.EncodeType (1)', () => {
      expect(() => {
        cv.encodeImageSync(cv.matrix([[1, 2, 3, 4], [5, 6, 7, 8]]), 'png')
      }).to.throwException(err => {
        expect(err.message).to.equal('second argument (type) must be one of [cv.EncodeType.JPEG, cv.EncodeType.PNG]');
      });
    });

    it('should fail if the second argument is not a cv.EncodeType (2)', () => {
      expect(() => {
        cv.encodeImageSync(cv.matrix([[1, 2, 3, 4], [5, 6, 7, 8]]), 666)
      }).to.throwException(err => {
        expect(err.message).to.equal('second argument (type) must be one of [cv.EncodeType.JPEG, cv.EncodeType.PNG]');
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
        expect(err.message).to.equal('second argument (sizeSpec) must be a valid sizeSpec object');
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

  describe('cv.resizeSync', () => {

    it('should resize image to width preserving aspect ratio', () => {
      const image = cv.readImageSync(testImagePath);
      const resized = cv.resizeSync(image, testImageWidth / 2);

      expect(resized.width).to.equal(testImageWidth / 2);
      expect(resized.height).to.equal(testImageHeight / 2);
      expect(resized.type).to.equal(cv.ImageType.BGR);
    });

    it('should resize gray image to width preserving aspect ratio', () => {
      const image = cv.readImageSync(testImagePath, cv.ImageType.Gray);
      const resized = cv.resizeSync(image, testImageWidth / 2);

      expect(resized.width).to.equal(testImageWidth / 2);
      expect(resized.height).to.equal(testImageHeight / 2);
      expect(resized.type).to.equal(cv.ImageType.Gray);
    });

    it('should resize image to width preserving aspect ratio', () => {
      const image = cv.readImageSync(testImagePath);
      const resized = cv.resizeSync(image, {width: testImageWidth / 4});

      expect(resized.width).to.equal(testImageWidth / 4);
      expect(resized.height).to.equal(testImageHeight / 4);
      expect(resized.type).to.equal(cv.ImageType.BGR);
    });

    it('should resize image to height preserving aspect ratio', () => {
      const image = cv.readImageSync(testImagePath);
      const resized = cv.resizeSync(image, {height: testImageHeight / 4});

      expect(resized.width).to.equal(testImageWidth / 4);
      expect(resized.height).to.equal(testImageHeight / 4);
      expect(resized.type).to.equal(cv.ImageType.BGR);
    });

  });

  describe('cv.warpAffine', () => {

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

  describe('cv.warpAffineSync', () => {

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
      const result = cv.warpAffineSync(matrix, transpose);

      expect(result.toArray()).to.eql([
        1, 3, 0,
        2, 4, 0,
        0, 0, 0
      ]);
    });

    it('should accept options object', () => {
      const matrix = cv.matrix([
        [1, 2, 0],
        [3, 4, 0],
        [0, 0, 0]
      ]);

      const rot = cv.rotationMatrix({x: 0, y: 0}, 90);

      const res1 = cv.warpAffineSync(matrix, rot, {borderType: cv.BorderType.Replicate});

      expect(res1.toArray()).to.eql([
        1, 3, 0,
        1, 3, 0,
        1, 3, 0
      ]);

      const res2 = cv.warpAffineSync(matrix, rot, {borderType: cv.BorderType.Constant, borderValue: 5});

      expect(res2.toArray()).to.eql([
        1, 3, 0,
        5, 5, 5,
        5, 5, 5
      ]);
    });

  });

  describe('cv.rotationMatrix', () => {

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

  describe('cv.rotate', () => {

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

  describe('cv.rotateSync', () => {

    it('should rotate an image', () => {
      const matrix = cv.matrix([
        [1, 2, 0],
        [3, 4, 0],
        [0, 0, 0]
      ]);

      const result = cv.rotateSync(matrix, 90);

      expect(result.toArray()).to.eql([
        0, 0, 0,
        2, 4, 0,
        1, 3, 0
      ]);
    });

    it('should accept an options object', () => {
      const matrix = cv.matrix([
        [1, 2, 0],
        [3, 4, 0],
        [0, 0, 0]
      ]);

      const result = cv.rotateSync(matrix, {angle: 90, xCenter: 0, yCenter: 1});

      expect(result.toArray()).to.eql([
        4, 0, 0,
        3, 0, 0,
        0, 0, 0
      ]);
    });

  });

  describe('cv.flipLeftRight', () => {

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

  describe('cv.flipLeftRightSync', () => {

    it('should flip an image', () => {
      const matrix = cv.matrix([
        [1, 2, 0],
        [3, 4, 0],
        [0, 0, 0]
      ]);

      const result = cv.flipLeftRightSync(matrix);

      expect(result.toArray()).to.eql([
        0, 2, 1,
        0, 4, 3,
        0, 0, 0
      ]);
    });

  });

  describe('cv.flipUpDown', () => {

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

  describe('cv.flipUpDownSync', () => {

    it('should flip an image', () => {
      const matrix = cv.matrix([
        [1, 2, 0],
        [3, 4, 0],
        [0, 0, 0]
      ]);

      const result = cv.flipUpDownSync(matrix);

      expect(result.toArray()).to.eql([
        0, 0, 0,
        3, 4, 0,
        1, 2, 0
      ]);
    });

  });

  describe('cv.split', () => {

    it('should split matrix into channels', () => {
      const matrix = cv.matrix({
        width: 3,
        height: 3,
        type: cv.ImageType.BGR,
        data: [
          1, 1, 1,
          2, 2, 2,
          3, 3, 3,

          4, 4, 4,
          5, 5, 5,
          6, 6, 6,

          7, 7, 7,
          8, 8, 8,
          9, 9, 9
        ]
      });

      return cv.split(matrix).then(channels => {
        expect(channels).to.have.length(3);

        expect(channels[0]).to.be.a(cv.Matrix);
        expect(channels[1]).to.be.a(cv.Matrix);
        expect(channels[2]).to.be.a(cv.Matrix);

        expect(channels[0].toArray()).to.eql([
          1, 1, 1,
          2, 2, 2,
          3, 3, 3
        ]);

        expect(channels[1].toArray()).to.eql([
          4, 4, 4,
          5, 5, 5,
          6, 6, 6
        ]);

        expect(channels[2].toArray()).to.eql([
          7, 7, 7,
          8, 8, 8,
          9, 9, 9
        ]);
      });
    });

  });

  describe('cv.splitSync', () => {

    it('should split matrix into channels', () => {
      const matrix = cv.matrix({
        width: 3,
        height: 3,
        type: cv.ImageType.BGR,
        data: [
          1, 1, 1,
          2, 2, 2,
          3, 3, 3,

          4, 4, 4,
          5, 5, 5,
          6, 6, 6,

          7, 7, 7,
          8, 8, 8,
          9, 9, 9
        ]
      });

      const channels =  cv.splitSync(matrix);
      expect(channels).to.have.length(3);

      expect(channels[0]).to.be.a(cv.Matrix);
      expect(channels[1]).to.be.a(cv.Matrix);
      expect(channels[2]).to.be.a(cv.Matrix);

      expect(channels[0].type).to.equal(cv.ImageType.Gray);
      expect(channels[1].type).to.equal(cv.ImageType.Gray);
      expect(channels[2].type).to.equal(cv.ImageType.Gray);

      expect(channels[0].toArray()).to.eql([
        1, 1, 1,
        2, 2, 2,
        3, 3, 3
      ]);

      expect(channels[1].toArray()).to.eql([
        4, 4, 4,
        5, 5, 5,
        6, 6, 6
      ]);

      expect(channels[2].toArray()).to.eql([
        7, 7, 7,
        8, 8, 8,
        9, 9, 9
      ]);
    });

  });

  describe('cv.merge', () => {

    it('should merge channels into a matrix', () => {
      const matrix = cv.matrix({
        width: 3,
        height: 3,
        type: cv.ImageType.BGR,
        data: [
          1, 1, 1,
          2, 2, 2,
          3, 3, 3,

          4, 4, 4,
          5, 5, 5,
          6, 6, 6,

          7, 7, 7,
          8, 8, 8,
          9, 9, 9
        ]
      });

      return cv.split(matrix).then(channels => {
        return cv.merge(...channels);
      }).then(merged => {
        expect(merged.type).to.equal(cv.ImageType.BGR);
        expect(merged.toArray()).to.eql([
          1, 1, 1,
          2, 2, 2,
          3, 3, 3,

          4, 4, 4,
          5, 5, 5,
          6, 6, 6,

          7, 7, 7,
          8, 8, 8,
          9, 9, 9
        ]);
      });
    });

  });

  describe('cv.mergeSync', () => {

    it('should merge channels into a matrix', () => {
      const matrix = cv.matrix({
        width: 3,
        height: 3,
        type: cv.ImageType.BGR,
        data: [
          1, 1, 1,
          2, 2, 2,
          3, 3, 3,

          4, 4, 4,
          5, 5, 5,
          6, 6, 6,

          7, 7, 7,
          8, 8, 8,
          9, 9, 9
        ]
      });

      const channels = cv.splitSync(matrix);
      const merged = cv.mergeSync(...channels);

      expect(merged.type).to.equal(cv.ImageType.BGR);
      expect(merged.toArray()).to.eql([
        1, 1, 1,
        2, 2, 2,
        3, 3, 3,

        4, 4, 4,
        5, 5, 5,
        6, 6, 6,

        7, 7, 7,
        8, 8, 8,
        9, 9, 9
      ]);
    });

  });

  describe('cv.lookup', () => {

    it('should map a matrix through a lookup table', () => {
      const matrix = cv.matrix({
        width: 3,
        height: 3,
        type: cv.ImageType.Gray,
        data: [
          0,   32,  64,
          96,  128, 160,
          192, 224, 255
        ]
      });

      const x = [0, 32, 64, 96, 128, 160, 192, 224, 255];
      const y = [1, 10, 20, 40, 80,  120, 180, 220, 240]

      const lookupTable = cv.matrix({
        width: 256,
        height: 1,
        type: cv.ImageType.Gray,
        data: _.range(256).map(it => spline(it, x, y))
      });

      const lu = lookupTable.toArray();

      return cv.lookup(matrix, lookupTable).then(result => {
        expect(result.type).to.equal(cv.ImageType.Gray);

        expect(matrix.toArray()).to.eql([
          0,   32,  64,
          96,  128, 160,
          192, 224, 255
        ]);

        expect(result.toArray()).to.eql([
          lu[0],   lu[32],  lu[64],
          lu[96],  lu[128], lu[160],
          lu[192], lu[224], lu[255]
        ]);
      });
    });

  });

  describe('cv.lookupSync', () => {

    it('should map a matrix through a lookup table', () => {
      const matrix = cv.matrix({
        width: 3,
        height: 3,
        type: cv.ImageType.Gray,
        data: [
          0,   32,  64,
          96,  128, 160,
          192, 224, 255
        ]
      });

      const x = [0, 32, 64, 96, 128, 160, 192, 224, 255];
      const y = [1, 10, 20, 40, 80,  120, 180, 220, 240]

      const lookupTable = cv.matrix({
        width: 256,
        height: 1,
        type: cv.ImageType.Gray,
        data: _.range(256).map(it => spline(it, x, y))
      });

      const lu = lookupTable.toArray();
      const result = cv.lookupSync(matrix, lookupTable);

      expect(result.type).to.equal(cv.ImageType.Gray);

      expect(matrix.toArray()).to.eql([
        0,   32,  64,
        96,  128, 160,
        192, 224, 255
      ]);

      expect(result.toArray()).to.eql([
        lu[0],   lu[32],  lu[64],
        lu[96],  lu[128], lu[160],
        lu[192], lu[224], lu[255]
      ]);
    });

  });

  describe('cv.gaussianBlur', () => {

    it('should blur an image', () => {
      const matrix = cv.matrix([
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 10, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
      ]);

      return Promise.all([
        cv.gaussianBlur(matrix, {kernelSize: 5}),
        cv.gaussianBlur(matrix, {kernelSize: {width: 5, height: 1}}),
        cv.gaussianBlur(matrix, {kernelSize: 5, sigma: 0.8}),
      ]).then(([res1, res2, res3]) => {
        res1 = res1.toArray().map(it => Math.round(it * 10));
        res2 = res2.toArray().map(it => Math.round(it * 10));
        res3 = res3.toArray().map(it => Math.round(it * 10));

        expect(res1).to.eql([
          2, 3, 5,  3, 2,
          3, 6, 9,  6, 3,
          5, 9, 14, 9, 5,
          3, 6, 9,  6, 3,
          2, 3, 5,  3, 2
        ]);

        expect(res2).to.eql([
          0,  0,  0,  0,  0,
          0,  0,  0,  0,  0,
          13, 25, 38, 25, 13,
          0,  0,  0,  0,  0,
          0,  0,  0,  0,  0
        ]);

        expect(res3).to.eql([
          0, 1,  2,  1,  0,
          1, 5,  11, 5,  1,
          2, 11, 25, 11, 2,
          1, 5,  11, 5,  1,
          0, 1,  2,  1,  0
        ]);
      });
    });

  });

  describe('cv.gaussianBlurSync', () => {

    it('should blur an image', () => {
      const matrix = cv.matrix([
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0]
      ]);

      let res1 = cv.gaussianBlurSync(matrix, {kernelSize: 3, xSigma: 0.5, ySigma: 0.5});
      let res2 = cv.gaussianBlurSync(matrix, {kernelSize: {width: 3, height: 1}, sigma: 0.5});
      let res3 = cv.gaussianBlurSync(matrix, {kernelSize: 3, sigma: 0.6});

      res1 = res1.toArray().map(it => Math.round(it * 10));
      res2 = res2.toArray().map(it => Math.round(it * 10));
      res3 = res3.toArray().map(it => Math.round(it * 10));

      expect(res1).to.eql([
        0, 2, 0,
        2, 6, 2,
        0, 2, 0
      ]);

      expect(res2).to.eql([
        0, 0, 0,
        2, 8, 2,
        0, 0, 0
      ]);

      expect(res3).to.eql([
        1, 2, 1,
        2, 4, 2,
        1, 2, 1
      ]);
    });

  });

  describe('cv.colorTemperature', () => {

    it('should change the color temperature of the image', () => {
      const matrix = cv.matrix({
        width: 3,
        height: 3,
        type: cv.ImageType.BGR,
        data: [
          0,   0,   0,
          128, 128, 128,
          255, 255, 255,

          0,   0,   0,
          128, 128, 128,
          255, 255, 255,

          0,   0,   0,
          128, 128, 128,
          255, 255, 255
        ]
      });

      return cv.colorTemperature(matrix, 4000, 1).then(result => {
        expect(result.toArray()).to.eql([
          0,   0,   0,
          95,  95,  95,
          255, 255, 255,

          0,   0,   0,
          124, 124, 124,
          255, 255, 255,

          0,   0,   0,
          161, 161, 161,
          255, 255, 255
        ]);
      });
    });

  });

  describe('cv.colorTemperatureSync', () => {

    it('should change the color temperature of the image', () => {
      const matrix = cv.matrix({
        width: 3,
        height: 3,
        type: cv.ImageType.BGR,
        data: [
          0,   0,   0,
          128, 128, 128,
          255, 255, 255,

          0,   0,   0,
          128, 128, 128,
          255, 255, 255,

          0,   0,   0,
          128, 128, 128,
          255, 255, 255
        ]
      });

      const result =  cv.colorTemperatureSync(matrix, 4000, 1);

      expect(result.toArray()).to.eql([
        0,   0,   0,
        95,  95,  95,
        255, 255, 255,

        0,   0,   0,
        124, 124, 124,
        255, 255, 255,

        0,   0,   0,
        161, 161, 161,
        255, 255, 255
      ]);
    });

  });

  describe('cv.convertColor', () => {

    it('should convert colors', () => {
      const matrix = cv.matrix({
        width: 3,
        height: 3,
        data: [
          1, 2, 3,
          4, 5, 5,
          7, 8, 9
        ],
        type: cv.ImageType.Gray
      });

      return cv.convertColor(matrix, cv.Conversion.GrayToBGR).then(result => {
        expect(result.type).to.equal(cv.ImageType.BGR);
      });
    });

  });

  describe('cv.convertColorSync', () => {

    it('should convert colors', () => {
      const matrix = cv.matrix({
        width: 3,
        height: 3,
        data: [
          1, 2, 3,
          4, 5, 5,
          7, 8, 9
        ],
        type: cv.ImageType.Gray
      });

      const result = cv.convertColorSync(matrix, cv.Conversion.GrayToBGR);
      expect(result.type).to.equal(cv.ImageType.BGR);
    });

  });

  describe('cv.drawRectangle', () => {

    it('should draw a rectangle', () => {
      const matrix = cv.matrix([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]);

      cv.drawRectangle(matrix, {
        x: 1,
        y: 1,
        width: 3,
        height: 3
      }, {
        red: 255,
        green: 255,
        blue: 255
      });

      expect(matrix.toArray()).to.eql([
        0, 0,     0,   0,
        0, 255, 255, 255,
        0, 255,   0, 255,
        0, 255, 255, 255,
      ]);
    });

  });

  describe('cv.drawLine', () => {

    it('should draw a line', () => {
      const matrix = cv.matrix([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]);

      cv.drawLine(matrix, {
        x: 1,
        y: 1,
      },{
        x: 3,
        y: 3
      }, {
        red: 255,
        green: 255,
        blue: 255
      });

      expect(matrix.toArray()).to.eql([
        0,   0,    0,    0,
        0, 255,    0,    0,
        0,   0,  255,    0,
        0,   0,    0,  255,
      ]);
    });

  });

  describe('Rect', () => {
    const Rect = cv.Rect;

    it('constructor should take an object', () => {
      const rect = new Rect({x: 1, y: 2, width: 3, height: 4});
      expect(rect).to.eql({x: 1, y: 2, width: 3, height: 4});
    });

    it('constructor should take x, y, width, height', () => {
      const rect = new Rect(1, 2, 3, 4);
      expect(rect).to.eql({x: 1, y: 2, width: 3, height: 4});
    });

    it('Rect.create should take an object', () => {
      const rect = Rect.create({x: 1, y: 2, width: 3, height: 4});
      expect(rect).to.eql({x: 1, y: 2, width: 3, height: 4});
    });

    it('Rect.create should take x, y, width, height', () => {
      const rect = Rect.create(1, 2, 3, 4);
      expect(rect).to.eql({x: 1, y: 2, width: 3, height: 4});
    });

    describe('Rect.multipliedBy', () => {

      it('Rect.multipliedBy should multiply all values', () => {
        const rect = new Rect(1, 2, 3, 4);
        const rect2 = rect.multipliedBy(2);

        expect(rect).to.eql({x: 1, y: 2, width: 3, height: 4});
        expect(rect2).to.eql({x: 2, y: 4, width: 6, height: 8});
      });

      it('Rect.multipliedBy should accept separate multiplier for x and y', () => {
        const rect = new Rect(1, 2, 3, 4);
        const rect2 = rect.multipliedBy(2, 4);

        expect(rect).to.eql({x: 1, y: 2, width: 3, height: 4});
        expect(rect2).to.eql({x: 2, y: 8, width: 6, height: 16});
      });

      it('Rect.multipliedBy should accept an object', () => {
        const rect = new Rect(1, 2, 3, 4);
        const rect2 = rect.multipliedBy({xMul: 2, yMul: 4});

        expect(rect).to.eql({x: 1, y: 2, width: 3, height: 4});
        expect(rect2).to.eql({x: 2, y: 8, width: 6, height: 16});
      });

    });

    describe('Rect.scaledBy', () => {

      it('Rect.scaledBy should scale the rectangle', () => {
        const rect = new Rect(1, 2, 3, 4);
        const rect2 = rect.scaledBy(2);

        expect(rect).to.eql({x: 1, y: 2, width: 3, height: 4});
        expect(rect2).to.eql({x: 1, y: 2, width: 6, height: 8});
      });

      it('Rect.scaledBy should accept separate scale for width and height', () => {
        const rect = new Rect(1, 2, 3, 4);
        const rect2 = rect.scaledBy(2, 4);

        expect(rect).to.eql({x: 1, y: 2, width: 3, height: 4});
        expect(rect2).to.eql({x: 1, y: 2, width: 6, height: 16});
      });

      it('Rect.multipliedBy should accept an object', () => {
        const rect = new Rect(1, 2, 3, 4);
        const rect2 = rect.scaledBy({xScale: 2, yScale: 4});

        expect(rect).to.eql({x: 1, y: 2, width: 3, height: 4});
        expect(rect2).to.eql({x: 1, y: 2, width: 6, height: 16});
      });

    });

    describe('Rect.movedBy', () => {

      it('Rect.movedBy should move the rectangle', () => {
        const rect = new Rect(1, 2, 3, 4);
        const rect2 = rect.movedBy(10, 20);

        expect(rect).to.eql({x: 1, y: 2, width: 3, height: 4});
        expect(rect2).to.eql({x: 11, y: 22, width: 3, height: 4});
      });

      it('Rect.movedBy should accept an object', () => {
        const rect = new Rect(1, 2, 3, 4);
        const rect2 = rect.movedBy({x: 2, y: 4});

        expect(rect).to.eql({x: 1, y: 2, width: 3, height: 4});
        expect(rect2).to.eql({x: 3, y: 6, width: 3, height: 4});
      });

    });

    describe('Rect.intersect', () => {

      it('should return an intersection of two rectangles', () => {
        let rect = Rect.create(0.2, 0.3, 1, 1);
        let intr = rect.intersection({x: 0.5, y: 0.4, width: 1, height: 1});
        expect(intr).to.eql({x: 0.5, y: 0.4, width: 0.7, height: 0.9});

        rect = Rect.create(0, 0, 1, 1);
        intr = rect.intersection({x: 2, y: 0.5, width: 1, height: 1});
        expect(intr).to.eql({x: 0, y: 0, width: 0, height: 0});
      });

    });

    describe('Rect.union', () => {

      it('should return an union of two rectangles', () => {
        let rect = Rect.create(-0.1, 0.1, 1, 1);
        let union = rect.union({x: 0.5, y: 0.5, width: 1, height: 1});
        expect(union).to.eql({x: -0.1, y: 0.1, width: 1.6, height: 1.4});
      });

    });

  });

});