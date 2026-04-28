import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hamme_app/providers/onboarding_providers.dart';

import '../../../../../core/widgets/gradient_button.dart';
import '../widgets/date_picker_wheels.dart';
import '../widgets/dob_top_bar.dart';

class DobScreen extends ConsumerStatefulWidget {
  const DobScreen({super.key});

  @override
  ConsumerState<DobScreen> createState() => _DobScreenState();
}

class _DobScreenState extends ConsumerState<DobScreen> {
  int _selectedDay = 1;
  int _selectedMonth = 0;
  int _selectedYear = 2000;

  bool _hasInteracted = false;

  late final FixedExtentScrollController _dayController;
  late final FixedExtentScrollController _monthController;
  late final FixedExtentScrollController _yearController;

  final List<String> _months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  final int _startYear = 1940;
  final int _endYear = DateTime.now().year - 5;

  @override
  void initState() {
    super.initState();
    final existingDob = ref.read(onboardingDraftProvider).birthday;
    if (existingDob != null) {
      _selectedDay = existingDob.day;
      _selectedMonth = existingDob.month - 1;
      _selectedYear = existingDob.year;
      _hasInteracted = true;
    }

    _dayController = FixedExtentScrollController(initialItem: _selectedDay - 1);
    _monthController = FixedExtentScrollController(initialItem: _selectedMonth);
    _yearController = FixedExtentScrollController(
      initialItem: _selectedYear - _startYear,
    );
  }

  @override
  void dispose() {
    _dayController.dispose();
    _monthController.dispose();
    _yearController.dispose();
    super.dispose();
  }

  int _daysInMonth(int month, int year) {
    return DateTime(year, month + 1, 0).day;
  }

  int get _age {
    final now = DateTime.now();
    final dob = DateTime(_selectedYear, _selectedMonth + 1, _selectedDay);
    int age = now.year - dob.year;
    if (now.month < dob.month ||
        (now.month == dob.month && now.day < dob.day)) {
      age--;
    }
    return age < 0 ? 0 : age;
  }

  void _onDayChanged(int index) {
    setState(() {
      _selectedDay = index + 1;
      _hasInteracted = true;
    });
  }

  void _onMonthChanged(int index) {
    setState(() {
      _selectedMonth = index;
      _hasInteracted = true;
      final maxDay = _daysInMonth(_selectedMonth + 1, _selectedYear);
      if (_selectedDay > maxDay) {
        _selectedDay = maxDay;
        _dayController.jumpToItem(_selectedDay - 1);
      }
    });
  }

  void _onYearChanged(int index) {
    setState(() {
      _selectedYear = _startYear + index;
      _hasInteracted = true;
      final maxDay = _daysInMonth(_selectedMonth + 1, _selectedYear);
      if (_selectedDay > maxDay) {
        _selectedDay = maxDay;
        _dayController.jumpToItem(_selectedDay - 1);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final maxDay = _daysInMonth(_selectedMonth + 1, _selectedYear);
    final displayAge = _hasInteracted ? _age.toString().padLeft(2, '0') : '00';

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              DobTopBar(onBack: () => context.pop()),
              const SizedBox(height: 30),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  "When's your birthday?",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'Nunito',
                    fontWeight: FontWeight.w900,
                    fontSize: 26,
                    color: Colors.black,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text('🎂', style: TextStyle(fontSize: 28)),
              const SizedBox(height: 32),
              Container(
                width: 140,
                height: 116,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F2F6),
                  borderRadius: BorderRadius.circular(28),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      displayAge,
                      style: const TextStyle(
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w800,
                        fontSize: 52,
                        color: Colors.black,
                        height: 1,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'years old',
                      style: TextStyle(
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: Color(0xFF8A96D0),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Expanded(
                child: DatePickerWheels(
                  maxDay: maxDay,
                  selectedDay: _selectedDay,
                  selectedMonth: _selectedMonth,
                  selectedYear: _selectedYear,
                  startYear: _startYear,
                  endYear: _endYear,
                  months: _months,
                  dayController: _dayController,
                  monthController: _monthController,
                  yearController: _yearController,
                  onDayChanged: _onDayChanged,
                  onMonthChanged: _onMonthChanged,
                  onYearChanged: _onYearChanged,
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                child: GradientButton(
                  label: 'Next',
                  onTap: () {
                    ref
                        .read(onboardingDraftProvider.notifier)
                        .setBirthday(
                          DateTime(
                            _selectedYear,
                            _selectedMonth + 1,
                            _selectedDay,
                          ),
                        );
                    context.go('/onboarding/name');
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
