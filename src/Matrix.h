#ifndef SIMPLE_CV_MATRIX_H
#define SIMPLE_CV_MATRIX_H

#include <nan.h>
#include <v8.h>
#include <opencv2/opencv.hpp>
#include "constants.h"
#include "utils.h"
#include "async.h"

class Matrix : public Nan::ObjectWrap {

public:

  static NAN_MODULE_INIT(init) {
    v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);

    tpl->SetClassName(Nan::New("__NativeMatrix").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::SetPrototypeMethod(tpl, "toArray", toArray);
    Nan::SetPrototypeMethod(tpl, "toBuffers", toBuffers);
    Nan::SetPrototypeMethod(tpl, "crop", crop);
    Nan::SetPrototypeMethod(tpl, "set", set);

    Nan::SetAccessor(tpl->InstanceTemplate(), Nan::New("height").ToLocalChecked(), getHeight);
    Nan::SetAccessor(tpl->InstanceTemplate(), Nan::New("width").ToLocalChecked(), getWidth);
    Nan::SetAccessor(tpl->InstanceTemplate(), Nan::New("type").ToLocalChecked(), getType);

    constructor().Reset(Nan::GetFunction(tpl).ToLocalChecked());

    Nan::Set(target, Nan::New("Matrix").ToLocalChecked(), Nan::GetFunction(tpl).ToLocalChecked());
  }

  static v8::Local<v8::Object> create() {
    Nan::EscapableHandleScope scope;

    v8::Local<v8::Value> args[] = {};
    auto constructor = Nan::New(Matrix::constructor());
    auto matrix = Nan::NewInstance(constructor, 0, args).ToLocalChecked();

    return scope.Escape(matrix);
  }

  static v8::Local<v8::Object> create(cv::Mat data) {
    Nan::EscapableHandleScope scope;

    if (data.type() != ImageTypeGray
        && data.type() != ImageTypeFloat
        && data.type() != ImageTypeBGR
        && data.type() != ImageTypeBGRA) {

      throw std::runtime_error("invalid image type");
    }

    auto matrix = Matrix::create();
    Nan::ObjectWrap::Unwrap<Matrix>(matrix)->mat() = data;

    return scope.Escape(matrix);
  }

  static v8::Local<v8::Object> create(int width, int height, int type = ImageTypeGray) {
    Nan::EscapableHandleScope scope;

    v8::Local<v8::Value> args[] = { Nan::New(width), Nan::New(height), Nan::New(type) };
    auto constructor = Nan::New(Matrix::constructor());

    return scope.Escape(Nan::NewInstance(constructor, 3, args).ToLocalChecked());
  }

  static bool isMatrix(v8::Local<v8::Value> val) {
    Nan::HandleScope scope;

    if (!val->IsObject()) {
      return false;
    }

    auto obj = val->ToObject();

    if (obj->InternalFieldCount() != 1) {
      return false;
    }

    // There must be a better way ...
    auto constructor = Nan::New(Matrix::constructor());
    return constructor->GetName() == obj->GetConstructorName();
  }

  static cv::Mat get(v8::Local<v8::Value> value) {
    return Nan::ObjectWrap::Unwrap<Matrix>(value->ToObject())->mat();
  }

  cv::Mat& mat() {
    return _mat;
  }

private:

  Matrix()
    : _mat() {
  }

  Matrix(int width, int height, int type = ImageTypeGray)
    : _mat(height, width, type) {
  }

  ~Matrix() {
    // Nothing to do here.
  }

  static NAN_METHOD(New) {
    if (!info.IsConstructCall()) {
      Nan::ThrowError("Class constructor Matrix cannot be invoked without 'new'");
      return;
    }

    // Zero argument call is allowed as a special case.
    if (info.Length() == 0) {

      Matrix *matrix = new Matrix();
      matrix->Wrap(info.This());
      info.GetReturnValue().Set(info.This());

    } else if (info.Length() == 1 && info[0]->IsArray()) {
      auto arr = info[0].As<v8::Array>();

      if (arr->Length() == 0) {
        Nan::ThrowError("array passed to Matrix constructor must have at least one element");
        return;
      }

      unsigned rows = arr->Length();
      unsigned cols = 0;
      cv::Mat mat;

      for (unsigned i = 0; i < rows; ++i) {
        auto row = Nan::Get(arr, i).ToLocalChecked();

        if (!row->IsArray()) {
          Nan::ThrowError("each row must be an array");
          return;
        }

        auto rowArr = row.As<v8::Array>();

        if (cols != 0 && rowArr->Length() != cols) {
          Nan::ThrowError("all rows must have the same length");
          return;
        }

        if (cols == 0) {
          cols = rowArr->Length();

          if (cols == 0) {
            Nan::ThrowError("each row must have at least one element");
            return;
          }

          mat = cv::Mat(rows, cols, ImageTypeFloat);
        }

        for (unsigned j = 0; j < cols; ++j) {
          auto item = Nan::Get(rowArr, j).ToLocalChecked();

          if (!item->IsNumber()) {
            Nan::ThrowError("all items in the arrays must be numbers");
            return;
          }

          mat.at<double>(i, j) = Nan::To<double>(item).FromJust();
        }
      }

      auto matrix = new Matrix();
      matrix->mat() = mat;
      matrix->Wrap(info.This());
      info.GetReturnValue().Set(info.This());

    } else if (info.Length() == 1 && info[0]->IsObject()) {

      auto args = info[0];
      int type = ImageTypeGray;

      if (!has(args, "width")
          || !has(args, "height")
          || !getValue(args, "width")->IsInt32()
          || !getValue(args, "height")->IsInt32()) {

        Nan::ThrowError("args.width and args.height must be integers");
        return;
      }

      int width = ::get<int>(args, "width");
      int height = ::get<int>(args, "height");

      if (width <= 0 || height <= 0) {
        Nan::ThrowError("args.width and args.height must be positive integers");
        return;
      }

      bool hasType = has(args, "type");

      if (hasType) {
        type = ::get<int>(args, "type");
      }

      if (type != ImageTypeGray && type != ImageTypeBGR && type != ImageTypeFloat) {
        Nan::ThrowError("type must be one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.Float]");
        return;
      }

      bool hasData = has(args, "data") && getValue(args, "data")->IsArray();

      if (hasData && !hasType) {
        type = ImageTypeFloat;
      }

      if (hasData && type == ImageTypeBGR) {
        Nan::ThrowError("type cv.ImageType.BGR is not yet supported with array data");
        return;
      }

      Matrix *matrix = new Matrix(width, height, type);
      cv::Mat mat = matrix->mat();

      if (hasData) {
        auto data = getValue(args, "data").As<v8::Array>();
        auto length = data->Length();

        if (length != static_cast<unsigned>(width * height)) {
          Nan::ThrowError("args.data must contain args.width * args.height elements");
          return;
        }

        for (unsigned i = 0; i < length; ++i) {
          auto item = Nan::Get(data, i).ToLocalChecked();

          if (!item->IsNumber()) {
            delete matrix;
            Nan::ThrowError("args.data must contain numbers");
            return;
          }

          if (type == ImageTypeFloat) {
            mat.at<double>(i) = Nan::To<double>(item).FromJust();
          } else {
            mat.at<uchar>(i) = static_cast<uchar>(Nan::To<int>(item).FromJust());
          }
        }
      }

      matrix->Wrap(info.This());
      info.GetReturnValue().Set(info.This());

    } else if (info.Length() >= 2 && info[0]->IsInt32() && info[1]->IsInt32()) {

      int type = ImageTypeGray;
      int width = Nan::To<int>(info[0]).FromJust();
      int height = Nan::To<int>(info[1]).FromJust();

      if (width <= 0 || height <= 0) {
        Nan::ThrowError("width and height must be positive integers");
        return;
      }

      if (info.Length() > 2) {
        if (!info[2]->IsInt32()) {
          Nan::ThrowError("the third argument (type) must be one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.Float]");
          return;
        }

        type = Nan::To<int>(info[2]).FromJust();

        if (type != ImageTypeGray && type != ImageTypeBGR && type != ImageTypeFloat) {
          Nan::ThrowError("the third argument (type) must be one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.Float]");
          return;
        }
      }

      Matrix *matrix = new Matrix(width, height, type);
      matrix->Wrap(info.This());
      info.GetReturnValue().Set(info.This());

    } else {
      Nan::ThrowError("expected either an object with a subset of fields {width, height, type?, data?} or arguments (width, height, type?)");
    }
  }

  static NAN_GETTER(getWidth) {
    Matrix* mat = Nan::ObjectWrap::Unwrap<Matrix>(info.Holder());
    info.GetReturnValue().Set(Nan::New(mat->_mat.cols));
  }

  static NAN_GETTER(getHeight) {
    Matrix* mat = Nan::ObjectWrap::Unwrap<Matrix>(info.Holder());
    info.GetReturnValue().Set(Nan::New(mat->_mat.rows));
  }

  static NAN_GETTER(getType) {
    Matrix* mat = Nan::ObjectWrap::Unwrap<Matrix>(info.Holder());
    info.GetReturnValue().Set(Nan::New(mat->_mat.type()));
  }

  static NAN_METHOD(toArray) {
    Matrix* mat = Nan::ObjectWrap::Unwrap<Matrix>(info.Holder());

    auto type = mat->mat().type();
    auto length = mat->mat().total();
    auto arr = v8::Array::New(info.GetIsolate(), static_cast<int>(length));

    if (type == ImageTypeBGR || type == ImageTypeBGRA) {
      Nan::ThrowError("toArray is not implemented for cv.ImageType.BGR(A) yet");
      return;
    }

    for (unsigned i = 0; i < length; ++i) {
      if (type == ImageTypeFloat) {
        Nan::Set(arr, i, Nan::New(mat->mat().at<double>(i)));
      } else if (type == ImageTypeGray) {
        Nan::Set(arr, i, Nan::New(mat->mat().at<uchar>(i)));
      }
    }

    info.GetReturnValue().Set(arr);
  }

  static NAN_METHOD(toBuffers) {
    cv::Mat self = Nan::ObjectWrap::Unwrap<Matrix>(info.Holder())->mat();
    v8::Local<v8::Value> ret;

    auto size = static_cast<unsigned>(self.total());
    auto data = reinterpret_cast<char *>(self.data);

    try {
      if (self.type() == ImageTypeGray) {
        auto buffer = Nan::CopyBuffer(data, size).ToLocalChecked();
        auto obj = Nan::New<v8::Object>();
        auto arr = Nan::New<v8::Array>(1);

        Nan::Set(obj, Nan::New("data").ToLocalChecked(), buffer);
        Nan::Set(obj, Nan::New("channel").ToLocalChecked(), Nan::New(ChannelGray));

        Nan::Set(arr, 0, obj);

        ret = arr;
      } else if (self.type() == ImageTypeFloat) {
        auto buffer = Nan::CopyBuffer(data, size).ToLocalChecked();
        auto obj = Nan::New<v8::Object>();
        auto arr = Nan::New<v8::Array>(1);

        Nan::Set(obj, Nan::New("data").ToLocalChecked(), buffer);
        Nan::Set(obj, Nan::New("channel").ToLocalChecked(), Nan::New(ChannelFloat));

        Nan::Set(arr, 0, obj);

        ret = arr;
      } else if (self.type() == ImageTypeBGR) {
        auto red = Nan::NewBuffer(size).ToLocalChecked();
        auto redData = node::Buffer::Data(red);
        auto redChannel = Nan::New<v8::Object>();

        auto green = Nan::NewBuffer(size).ToLocalChecked();
        auto greenData = node::Buffer::Data(green);
        auto greenChannel = Nan::New<v8::Object>();

        auto blue = Nan::NewBuffer(size).ToLocalChecked();
        auto blueData = node::Buffer::Data(blue);
        auto blueChannel = Nan::New<v8::Object>();

        for (unsigned i = 0, j = 0; i < size; i += 3, ++j) {
          blueData[j] = data[i];
          greenData[j] = data[i + 1];
          redData[j] = data[i + 2];
        }

        Nan::Set(redChannel, Nan::New("data").ToLocalChecked(), red);
        Nan::Set(redChannel, Nan::New("channel").ToLocalChecked(), Nan::New(ChannelRed));

        Nan::Set(greenChannel, Nan::New("data").ToLocalChecked(), green);
        Nan::Set(greenChannel, Nan::New("channel").ToLocalChecked(), Nan::New(ChannelGreen));

        Nan::Set(blueChannel, Nan::New("data").ToLocalChecked(), blue);
        Nan::Set(blueChannel, Nan::New("channel").ToLocalChecked(), Nan::New(ChannelBlue));

        auto arr = Nan::New<v8::Array>(3);

        Nan::Set(arr, 0, blueChannel);
        Nan::Set(arr, 1, greenChannel);
        Nan::Set(arr, 2, redChannel);

        ret = arr;
      } else if (self.type() == ImageTypeBGRA) {
        auto red = Nan::NewBuffer(size).ToLocalChecked();
        auto redData = node::Buffer::Data(red);
        auto redChannel = Nan::New<v8::Object>();

        auto green = Nan::NewBuffer(size).ToLocalChecked();
        auto greenData = node::Buffer::Data(green);
        auto greenChannel = Nan::New<v8::Object>();

        auto blue = Nan::NewBuffer(size).ToLocalChecked();
        auto blueData = node::Buffer::Data(blue);
        auto blueChannel = Nan::New<v8::Object>();

        auto alpha = Nan::NewBuffer(size).ToLocalChecked();
        auto alphaData = node::Buffer::Data(blue);
        auto alphaChannel = Nan::New<v8::Object>();

        for (unsigned i = 0, j = 0; i < size; i += 4, ++j) {
          blueData[j] = data[i];
          greenData[j] = data[i + 1];
          redData[j] = data[i + 2];
          alphaData[j] = data[i + 3];
        }

        Nan::Set(redChannel, Nan::New("data").ToLocalChecked(), red);
        Nan::Set(redChannel, Nan::New("channel").ToLocalChecked(), Nan::New(ChannelRed));

        Nan::Set(greenChannel, Nan::New("data").ToLocalChecked(), green);
        Nan::Set(greenChannel, Nan::New("channel").ToLocalChecked(), Nan::New(ChannelGreen));

        Nan::Set(blueChannel, Nan::New("data").ToLocalChecked(), blue);
        Nan::Set(blueChannel, Nan::New("channel").ToLocalChecked(), Nan::New(ChannelBlue));

        Nan::Set(alphaChannel, Nan::New("data").ToLocalChecked(), alpha);
        Nan::Set(alphaChannel, Nan::New("channel").ToLocalChecked(), Nan::New(ChannelAlpha));

        auto arr = Nan::New<v8::Array>(4);

        Nan::Set(arr, 0, blueChannel);
        Nan::Set(arr, 1, greenChannel);
        Nan::Set(arr, 2, redChannel);
        Nan::Set(arr, 3, alphaChannel);

        ret = arr;
      }

      info.GetReturnValue().Set(ret);
    } catch (std::exception& err) {
      Nan::ThrowError(err.what());
    }
  }

  static NAN_METHOD(set) {
    cv::Mat self = Nan::ObjectWrap::Unwrap<Matrix>(info.Holder())->mat();

    if (info.Length() != 3) {
      Nan::ThrowError("expected three arguments (matrix, point, callback)");
      return;
    }

    if (!Matrix::isMatrix(info[0])) {
      Nan::ThrowError("first argument (matrix) must be a matrix");
      return;
    }

    cv::Mat mat = Matrix::get(info[0]);

    if (self.type() != mat.type()) {
      Nan::ThrowError("the type of source matrix must be the same as the target matrix");
      return;
    }

    if (!isPoint(info[1])) {
      Nan::ThrowError("second argument (point) must be a Point {x, y}");
      return;
    }

    if (!info[2]->IsFunction()) {
      Nan::ThrowError("second argument (callback) must be a function");
      return;
    }

    auto point = getPoint<int>(info[1]);
    auto x = point.x;
    auto y = point.y;
    auto w = mat.size().width;
    auto h = mat.size().height;

    if (x < 0 || y < 0 || x + w > self.size().width || y + h > self.size().height) {
      std::ostringstream msg;
      msg << "set (x=" << x << ".." << (x + w) << ", y=" << y << ".." << (y + h) << ") goes outside the matrix bounds (w=" << self.size().width << ", h=" << self.size().height << ")";
      Nan::ThrowError(msg.str().c_str());
      return;
    }

    asyncOp(info[2].As<v8::Function>(), [self, mat, x, y, w, h]() {
      mat.copyTo(self(cv::Rect(x, y, w, h)));
    });
  }

  static NAN_METHOD(crop) {
    cv::Mat self = Nan::ObjectWrap::Unwrap<Matrix>(info.Holder())->mat();

    if (info.Length() != 2) {
      Nan::ThrowError("expected two arguments (rect, callback)");
      return;
    }

    auto rect = info[0];

    if (!isRect(rect)) {
      Nan::ThrowError("first argument (rect) must be a rectangle: {x, y, width, height}");
      return;
    }

    if (!info[1]->IsFunction()) {
      Nan::ThrowError("second argument (callback) must be a function");
      return;
    }

    int matWidth = self.size().width;
    int matHeight = self.size().height;

    auto cropRect = getRect<int>(rect);
    auto x = cropRect.x;
    auto y = cropRect.y;
    auto w = cropRect.width;
    auto h = cropRect.height;

    if (x < 0 || x + w > matWidth || y < 0 || y + h > matHeight) {
      std::ostringstream msg;
      msg << "crop (x=" << x << ".." << (x + w) << ", y=" << y << ".." << (y + h) << ") goes outside the matrix bounds (w=" << matWidth << ", h=" << matHeight << ")";
      Nan::ThrowError(msg.str().c_str());
      return;
    }

    asyncOp<cv::Mat>(info[1].As<v8::Function>(), [self, cropRect]() {
      return self(cropRect).clone();
    }, [](const cv::Mat& result) {
      return Matrix::create(result);
    });
  }

  static inline Nan::Persistent<v8::Function>& constructor() {
    static Nan::Persistent<v8::Function> constructor;
    return constructor;
  }

  cv::Mat _mat;
};


#endif //SIMPLE_CV_MATRIX_H
