#ifndef SIMPLE_CV_WAITKEY_H
#define SIMPLE_CV_WAITKEY_H

#include <nan.h>
#include <opencv2/opencv.hpp>

NAN_METHOD(waitKey) {
  int delay = 0;

  if (info.Length() > 0 && info[0]->IsInt32()) {
    delay = Nan::To<int>(info[0]).FromJust();
  }

  int key = cv::waitKey(delay);
  info.GetReturnValue().Set(Nan::New(key));
}

#endif //SIMPLE_CV_WAITKEY_H
