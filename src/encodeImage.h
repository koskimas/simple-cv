#ifndef SIMPLE_CV_ENCODEIMAGE_H
#define SIMPLE_CV_ENCODEIMAGE_H

#include "Matrix.h"
#include "async.h"

NAN_METHOD(encodeImage) {
  if (info.Length() < 3) {
    Nan::ThrowError("expected three (image, type, callback) arguments");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be a Matrix");
    return;
  }

  if (!info[1]->IsInt32()) {
    Nan::ThrowError("second argument (type) must be one of [cv.EncodeType.JPEG, cv.EncodeType.PNG]");
    return;
  }

  int type = Nan::To<int>(info[1]).FromJust();

  if (type != EncodeTypeJPEG && type != EncodeTypePNG) {
    Nan::ThrowError("second argument (type) must be one of [cv.EncodeType.JPEG, cv.EncodeType.PNG]");
    return;
  }

  if (!info[2]->IsFunction()) {
    Nan::ThrowError("third argument (callback) must be a function");
    return;
  }

  cv::Mat image = Matrix::get(info[0]);
  v8::Local<v8::Function> callback = info[2].As<v8::Function>();

  asyncOp<std::vector<uchar>>(callback, [type, image]() {
    std::vector<uchar> data;

    if (type == EncodeTypeJPEG) {
      cv::imencode(".jpg", image, data);
    } else {
      cv::imencode(".png", image, data);
    }

    return data;
  }, [](const std::vector<uchar>& data) {
    return Nan::CopyBuffer(reinterpret_cast<const char*>(data.data()), static_cast<unsigned>(data.size())).ToLocalChecked();
  });
}

#endif // SIMPLE_CV_ENCODEIMAGE_H
