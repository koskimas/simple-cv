#include "readImage.h"
#include "decodeImage.h"
#include "writeImage.h"
#include "encodeImage.h"
#include "showImage.h"
#include "waitKey.h"
#include "resize.h"
#include "warpAffine.h"
#include "rotationMatrix.h"
#include "flipUpDown.h"
#include "flipLeftRight.h"
#include "drawRectangle.h"
#include "convertColor.h"

NAN_MODULE_INIT(Init) {
  initConstants(target);

  Matrix::init(target);

  Nan::SetMethod(target, "readImage", readImage);
  Nan::SetMethod(target, "decodeImage", decodeImage);
  Nan::SetMethod(target, "writeImage", writeImage);
  Nan::SetMethod(target, "encodeImage", encodeImage);
  Nan::SetMethod(target, "showImage", showImage);
  Nan::SetMethod(target, "waitKey", waitKey);
  Nan::SetMethod(target, "resize", resize);
  Nan::SetMethod(target, "warpAffine", warpAffine);
  Nan::SetMethod(target, "rotationMatrix", rotationMatrix);
  Nan::SetMethod(target, "flipUpDown", flipUpDown);
  Nan::SetMethod(target, "flipLeftRight", flipLeftRight);
  Nan::SetMethod(target, "drawRectangle", drawRectangle);
  Nan::SetMethod(target, "convertColor", convertColor);
}

NODE_MODULE(simple_cv, Init)