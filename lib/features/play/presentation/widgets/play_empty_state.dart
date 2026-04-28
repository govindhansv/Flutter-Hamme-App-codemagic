import 'package:flutter/material.dart';
import 'package:hamme_app/utils/constants/colors.dart';
import 'package:hamme_app/utils/constants/fonts.dart';
import 'package:hamme_app/utils/constants/text_strings.dart';

class PlayEmptyState extends StatelessWidget {
  const PlayEmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SizedBox(
          height: 250,
          child: Stack(
            alignment: Alignment.topCenter,
            children: [
              Positioned(
                top: 0,
                child: Container(
                  width: 226,
                  height: 180,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Colors.white, TColors.hammeCardShade],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
              ),
              Positioned(
                top: 15,
                child: Container(
                  width: 290,
                  height: 180,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Colors.white, TColors.hammeCardShade],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
              ),
              Positioned(
                top: 35,
                child: Container(
                  width: 345,
                  height: 186,
                  decoration: BoxDecoration(
                    color: TColors.primaryBackground,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      TTexts.playEmptyTitle,
                      style: TextStyle(
                        fontFamily: TFonts.nunito,
                        fontWeight: FontWeight.w900,
                        fontSize: 28,
                        color: TColors.hammePrimary,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        const Text(
          TTexts.playEmptySubtitle,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontFamily: TFonts.nunito,
            fontWeight: FontWeight.w600,
            fontSize: 16,
            color: TColors.black,
          ),
        ),
      ],
    );
  }
}
