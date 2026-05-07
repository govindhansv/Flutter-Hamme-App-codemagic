import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hamme_app/features/inbox/domain/models/inbox_variation.dart';
import 'package:hamme_app/utils/constants/colors.dart';
import '../../../shared/presentation/widgets/hamme_bottom_nav_bar.dart';
import '../../../shared/presentation/widgets/hamme_top_bar.dart';
import '../widgets/inbox_reaction_card.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<InboxVariation> _variations = const [
    InboxVariation(
      gradientColors: [TColors.hammeInboxPinkStart, TColors.hammeInboxPinkEnd],
      borderColor: TColors.hammeInboxPinkBorder,
      emoji: '😍',
    ),
    InboxVariation(
      gradientColors: [TColors.hammeInboxBlueStart, TColors.hammeInboxBlueEnd],
      borderColor: TColors.hammeInboxBlueBorder,
      emoji: '🤝',
    ),
    InboxVariation(
      gradientColors: [
        TColors.hammeInboxPurpleStart,
        TColors.hammeInboxPurpleEnd,
      ],
      borderColor: TColors.hammeInboxPurpleBorder,
      emoji: '😈',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TColors.white,
      body: SafeArea(
        child: Column(
          children: [
            const HammeTopBar(),

            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    height: 360,
                    child: PageView.builder(
                      controller: _pageController,
                      onPageChanged: (index) {
                        setState(() {
                          _currentPage = index;
                        });
                      },
                      itemCount: _variations.length,
                      itemBuilder: (context, index) {
                        final variation = _variations[index];
                        return InboxReactionCard(variation: variation);
                      },
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _variations.length,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: _currentPage == index ? 16 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color:
                              _currentPage == index
                                  ? TColors.black
                                  : TColors.grey,
                          borderRadius: BorderRadius.circular(13),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: HammeBottomNavBar(
        currentIndex: 2,
        onTap: (index) {
          if (index == 0) {
            context.go('/home');
          } else if (index == 1) {
            context.go('/play');
          }
        },
      ),
    );
  }
}
