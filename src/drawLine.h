#ifndef SIMPLE_CV_DRAW_LINE_H
#define SIMPLE_CV_DRAW_LINE_H

#include "Matrix.h"
#include "utils.h"

NAN_METHOD(drawLine) {
  if (info.Length() < 4) {
    Nan::ThrowError("expected three arguments (image, point1, point2, color, width)");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be an instance of Matrix");
    return;
  }

  if (!isPoint(info[1])) {
    Nan::ThrowError("second argument (point1) must be a point");
    return;
  }

  if (!isPoint(info[2])) {
    Nan::ThrowError("third argument (point2) must be a point");
    return;
  }

  if (!isColor(info[3])) {
    Nan::ThrowError("second argument (color) must be a color");
    return;
  }

  auto image = Matrix::get(info[0]);
  auto point1 = getPoint<int>(info[1]);
  auto point2 = getPoint<int>(info[2]);
  auto color = getColor<int>(info[3]);
  auto width = 1;

  if (info.Length() >= 5 && info[4]->IsNumber()) {
    width = Nan::To<int>(info[4]).FromJust();
  }

  cv::line(image, point1, point2, color, width);
}

#endif // SIMPLE_CV_DRAW_LINE_H
