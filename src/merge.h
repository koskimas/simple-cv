#ifndef SIMPLE_CV_MERGE_H
#define SIMPLE_CV_MERGE_H

#include "Matrix.h"
#include "async.h"

NAN_METHOD(merge) {
  std::vector<cv::Mat> channels;

  for (int i = 0; i < info.Length(); ++i) {
    if (Matrix::isMatrix(info[i])) {
      channels.push_back(Matrix::get(info[i]));
    }
  }

  maybeAsyncOp<cv::Mat>(info, [channels]() {
    cv::Mat merged;
    cv::merge(channels, merged);
    return merged;
  }, [](const cv::Mat& merged) {
    return Matrix::create(merged);
  });
}

#endif // SIMPLE_CV_MERGE_H
