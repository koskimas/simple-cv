#ifndef SIMPLE_CV_ROTATIONMATRIX_H
#define SIMPLE_CV_ROTATIONMATRIX_H

#include "Matrix.h"
#include "async.h"
#include "utils.h"
#include "constants.h"

NAN_METHOD(rotationMatrix) {
  if (info.Length() < 2) {
    Nan::ThrowError("expected at least two arguments (center, angle)");
    return;
  }

  if (!isPoint(info[0])) {
    Nan::ThrowError("first argument (center) must be a Point {x, y}");
    return;
  }

  auto center = getPoint<double>(info[0]);

  if (!info[1]->IsNumber()) {
    Nan::ThrowError("second argument (angle) must be a number");
    return;
  }

  auto angle = Nan::To<double>(info[1]).FromJust();
  auto scale = 1.0;

  if (info.Length() == 4) {
    if (!info[2]->IsNumber()) {
      Nan::ThrowError("third argument (scale) must be a number");
      return;
    }

    scale = Nan::To<double>(info[2]).FromJust();
  }

  try {
    cv::Mat rotationMatrix = cv::getRotationMatrix2D(center, angle, scale);
    info.GetReturnValue().Set(Matrix::create(rotationMatrix));
  } catch (std::exception& err) {
    Nan::ThrowError(err.what());
  }
}


#endif //SIMPLE_CV_ROTATIONMATRIX_H
