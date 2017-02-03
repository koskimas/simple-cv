#ifndef SIMPLE_CV_DECODEIMAGE_H
#define SIMPLE_CV_DECODEIMAGE_H

#include "Matrix.h"
#include "async.h"

NAN_METHOD(decodeimage) {
  int decodeType = cv::IMREAD_UNCHANGED;

  if (info.Length() < 2) {
    Nan::ThrowError("expected three (data, callback) arguments");
    return;
  }

  if (!node::Buffer::HasInstance(info[0])) {
    Nan::ThrowError("first argument (data) must be a Buffer");
    return;
  }

  if (info.Length() == 2 && !info[1]->IsFunction()) {
    Nan::ThrowError("second argument (callback) must be a function");
    return;
  }

  if (info.Length() >= 3) {
    if (!info[1]->IsInt32()) {
      Nan::ThrowError("second argument (depth) must be a one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.BGRA]");
      return;
    }

    if (!info[2]->IsFunction()) {
      Nan::ThrowError("third argument (callback) must be a function");
      return;
    }

    int depth = Nan::To<int>(info[1]).FromJust();

    if (depth == ImageTypeGray) {
      decodeType = cv::IMREAD_GRAYSCALE;
    } else if (depth == ImageTypeBGR) {
      decodeType = cv::IMREAD_COLOR;
    } else if (depth == ImageTypeBGRA) {
      decodeType = cv::IMREAD_UNCHANGED;
    } else {
      Nan::ThrowError("second argument (depth) must be a one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.BGRA]");
      return;
    }
  }

  auto bytes = reinterpret_cast<uchar*>(node::Buffer::Data(info[0]));
  auto size = node::Buffer::Length(info[0]);

  std::vector<uchar> data(bytes, bytes + size);
  v8::Local<v8::Function> callback = (info.Length() == 2 ? info[1] : info[2]).As<v8::Function>();

  asyncOp<cv::Mat>(callback, [data, decodeType]() {
    auto image = cv::imdecode(data, decodeType);

    if (image.empty()) {
      throw std::runtime_error("invalid image data");
    }

    return image;
  }, [](const cv::Mat& result) {
    return Matrix::create(result);
  });
}

#endif //SIMPLE_CV_DECODEIMAGE_H
