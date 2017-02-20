#ifndef SIMPLE_CV_ENCODEIMAGE_H
#define SIMPLE_CV_ENCODEIMAGE_H

#include "Matrix.h"
#include "async.h"

/**
 * encodeImage(image, type, callback)
 * encodeImage(image, type)
 */
NAN_METHOD(encodeImage) {
  int type;

  if (info.Length() < 2 || info.Length() > 3) {
    Nan::ThrowError("expected at least two arguments (image, type) and at most three arguments (image, type, callback)");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be a Matrix");
    return;
  }

  if (info[1]->IsInt32()) {
    type = Nan::To<int>(info[1]).FromJust();

    if (type != EncodeTypeJPEG && type != EncodeTypePNG) {
      Nan::ThrowError("second argument (type) must be one of [cv.EncodeType.JPEG, cv.EncodeType.PNG]");
      return;
    }
  } else {
    Nan::ThrowError("second argument (type) must be one of [cv.EncodeType.JPEG, cv.EncodeType.PNG]");
    return;
  }

  if (info.Length() == 3 && !info[2]->IsFunction()) {
    Nan::ThrowError("third argument (callback) must be a function");
    return;
  }

  cv::Mat image = Matrix::get(info[0]);

  maybeAsyncOp<std::vector<uchar>>(info, [type, image]() {
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
