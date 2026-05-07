import 'package:flutter/material.dart';
import 'package:hamme_app/utils/constants/colors.dart';
import 'package:hamme_app/utils/constants/fonts.dart';

class AvatarBubble extends StatelessWidget {
  const AvatarBubble({super.key, required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: Text(
        label,
        style: const TextStyle(
          fontFamily: TFonts.nunito,
          fontSize: 12,
          fontWeight: FontWeight.w900,
          color: TColors.white,
        ),
      ),
    );
  }
}
