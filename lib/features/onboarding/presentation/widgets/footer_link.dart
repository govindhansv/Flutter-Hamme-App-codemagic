import 'package:flutter/material.dart';
import 'package:hamme_app/utils/constants/colors.dart';
import 'package:hamme_app/utils/constants/fonts.dart';

class FooterLink extends StatelessWidget {
  const FooterLink({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        fontFamily: TFonts.nunito,
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: TColors.darkGrey,
      ),
    );
  }
}
