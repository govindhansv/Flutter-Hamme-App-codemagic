import 'package:flutter/material.dart';

class HeaderCurveClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    return Path()
      ..lineTo(0, size.height - 12)
      ..quadraticBezierTo(
        size.width / 2,
        size.height,
        size.width,
        size.height - 12,
      )
      ..lineTo(size.width, 0)
      ..close();
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}
