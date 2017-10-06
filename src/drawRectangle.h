#ifndef SIMPLE_CV_DRAW_RECTANGLE_H
#define SIMPLE_CV_DRAW_RECTANGLE_H

#include "Matrix.h"
#include "utils.h"

NAN_METHOD(drawRectangle) {
  if (info.Length() < 3) {
    Nan::ThrowError("expected three arguments (image, rect, color, width)");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be an instance of Matrix");
    return;
  }

  if (!isRect(info[1])) {
    Nan::ThrowError("second argument (rect) must be a rectangle");
    return;
  }

  if (!isColor(info[2])) {
    Nan::ThrowError("second argument (color) must be a color");
    return;
  }

  auto image = Matrix::get(info[0]);
  auto rect = getRect<int>(info[1]);
  auto color = getColor(info[2]);
  auto width = 1;

  if (info.Length() >= 4 && info[3]->IsNumber()) {
    width = Nan::To<int>(info[3]).FromJust();
  }

  cv::rectangle(image, rect, color, width);
}

#endif // SIMPLE_CV_DRAW_RECTANGLE_H
