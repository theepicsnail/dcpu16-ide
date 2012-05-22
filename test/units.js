function units() {

	module("opcodes Module");
	
	test("SET Bad Programs", function() { 
		var e = new Emulator();
		
		raises(function() {
			e.run([ 0x18 ]);
		}, "Test bad op code");
		
	});
	
	test("SET Test", function() { 
		//expect(8);
		
		var program = [
			// register tests
			Utils.makeInstruction(OPERATION_SET, Literals.L_2, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_10, REGISTER_B),
			Utils.makeInstruction(OPERATION_SET, REGISTER_B, REGISTER_C),
			
			// register + RAM tests
			Utils.makeInstruction(OPERATION_SET, Literals.L_3, REGISTER_B + Values.REGISTER_VALUE_OFFSET),
			Utils.makeInstruction(OPERATION_SET, REGISTER_B + Values.REGISTER_VALUE_OFFSET, REGISTER_I),
			
			// register + RAM + next word tests
			Utils.makeInstruction(OPERATION_SET, Literals.L_4, REGISTER_A + Values.REGISTER_NEXT_WORD_OFFSET), 0x03,
			Utils.makeInstruction(OPERATION_SET, REGISTER_A + Values.REGISTER_NEXT_WORD_OFFSET, REGISTER_J), 0x03,
			
			// next word tests
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_X), 0x2222,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_VALUE, REGISTER_Y), 0x0a,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, Values.NEXT_WORD_VALUE), 0x3333, 0x0b
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.A.get(), 2, "Register A set correctly");
		equal(e.Registers.B.get(), 10, "Register B set correctly");
		equal(e.Registers.C.get(), 10, "Register C set to value of B");
		
		equal(e.RAM[0x0a], 3, "RAM at location 10 set to value of 3");
		equal(e.Registers.I.get(), e.RAM[0x0a], "Register I set to RAM at location 10");
		
		equal(e.RAM[0x05], 4, "RAM at location 5 set to value of 4");
		equal(e.Registers.J.get(), e.RAM[0x05], "Register J set to RAM at location 5");
		
		equal(e.Registers.X.get(), 0x2222, "Register X set to NEXT_WORD_LITERAL");
		equal(e.Registers.Y.get(), 3, "Register Y set to NEXT_WORD_VALUE");
		equal(e.RAM[0x0b], 0x3333, "RAM at NEXT_WORD_VALUE set to NEXT_WORD_LITERAL");
		
	});
	
	test("SP Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Literals.L_5, Values.SP_OFFSET),		// push 5
			Utils.makeInstruction(OPERATION_SET, Literals.L_4, Values.SP_OFFSET),		// push 4
			Utils.makeInstruction(OPERATION_SET, Literals.L_3, Values.SP_OFFSET),		// push 3
			Utils.makeInstruction(OPERATION_SET, Literals.L_2, Values.SP_OFFSET),		// push 2
			Utils.makeInstruction(OPERATION_SET, Literals.L_1, Values.SP_OFFSET),		// push 1
			Utils.makeInstruction(OPERATION_SET, Literals.L_0, Values.SP_OFFSET),		// push 0
			Utils.makeInstruction(OPERATION_SET, Literals["L_-1"], Values.SP_OFFSET),	// push -1
			
			Utils.makeInstruction(OPERATION_SET, Values.SP_OFFSET, REGISTER_A),		// pop -1
			Utils.makeInstruction(OPERATION_SET, Values.SP_OFFSET+1, REGISTER_B),		// peak 0
			Utils.makeInstruction(OPERATION_SET, Values.SP_OFFSET+2, REGISTER_C),	0x3,// pick 3
			Utils.makeInstruction(OPERATION_SET, Values.SP_OFFSET, REGISTER_I),		// pop 0
			Utils.makeInstruction(OPERATION_SET, Values.SP_OFFSET, REGISTER_J),		// pop 1
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.A.get(), -1, "Register A is -1");
		equal(e.Registers.B.get(), 0, "Register B is 0");
		equal(e.Registers.C.get(), 3, "Register C is 3");
		equal(e.Registers.I.get(), 0, "Register I is 0");
		equal(e.Registers.J.get(), 1, "Register J is 1");
		equal(e.Registers.SP.get(), 0xfffb, "Register SP is 0xfffb");
	});
	
	
	
	test("ADD Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Literals.L_2, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_4, REGISTER_B),
			Utils.makeInstruction(OPERATION_ADD, REGISTER_A, REGISTER_B),
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_X), 0x8800,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_Y), 0x8801,
			Utils.makeInstruction(OPERATION_ADD, REGISTER_X, REGISTER_Y)
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 6, "Register B is sum of A and B");
		equal(e.Registers.Y.get(), 0x1001, "Register Y is sum of 0x8800 and 0x8801");
		equal(e.Registers.EX.get(), 1, "Register EX shows overflow");
	});
	
	
	test("SUB Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Literals.L_2, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_4, REGISTER_B),
			Utils.makeInstruction(OPERATION_SUB, REGISTER_A, REGISTER_B),
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_X), 0x8801,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_Y), 0x4800,
			Utils.makeInstruction(OPERATION_SUB, REGISTER_X, REGISTER_Y)
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 2, "Register B is difference of B and A");
		equal(e.Registers.Y.get(), 0xbfff, "Register Y is difference of 0x4800 and 0x8801");
		equal(e.Registers.EX.get(), 0xffff, "Register EX shows overflow");
	});
	
	test("MUL Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Literals.L_2, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_4, REGISTER_B),
			Utils.makeInstruction(OPERATION_MUL, REGISTER_A, REGISTER_B),
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_X), 0x1010,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_Y), 0x0408,
			Utils.makeInstruction(OPERATION_MUL, REGISTER_X, REGISTER_Y)
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 8, "Register B is product of B and A");
		equal(e.Registers.Y.get(), 0xc080, "Register Y is product of 0x1010 and 0x0400");
		equal(e.Registers.EX.get(), 0x0040, "Register EX shows overflow");
	});
	
	test("MLI Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0xFFFB,	// -5
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x02,
			Utils.makeInstruction(OPERATION_MLI, REGISTER_A, REGISTER_B),							// B = -10
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_X), 0xD8F0,	// -10,000
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_Y), 0xEB20,	// -5,344
			Utils.makeInstruction(OPERATION_MLI, REGISTER_X, REGISTER_Y)							// X = 0x6E00, EX=0x32F
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0xFFF6, "Register B is product of B and A");
		equal(e.Registers.Y.get(),  0x6E00, "Register Y is product of 0xD8F0 and 0xEB20");
		equal(e.Registers.EX.get(), 0x32F, "Register EX shows overflow");
	});
	
	test("DIV Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x03,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x2c,		// 44
			Utils.makeInstruction(OPERATION_DIV, REGISTER_A, REGISTER_B),							// B = 14
			Utils.makeInstruction(OPERATION_SET, REGISTER_EX, REGISTER_I),
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_X), 0x0332,	
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_Y), 0xF445,	// 
			Utils.makeInstruction(OPERATION_DIV, REGISTER_X, REGISTER_Y)							// X = 0x4c, EX=0x723a
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0x0e, "Register B is quotient of B and A");
		equal(e.Registers.I.get(), 0xAAAA, "Register I shows overflow from first operation");
		equal(e.Registers.Y.get(),  0x4c, "Register Y is quotient of 0xD8F0 and 0xEB20");
		//equal(e.Registers.EX.get(), 0x723a, "Register EX shows overflow");
	});
	
	test("DVI Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0xFFFD,	// -3
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x2c,		// 44
			Utils.makeInstruction(OPERATION_DVI, REGISTER_A, REGISTER_B),							// B = -14
			Utils.makeInstruction(OPERATION_SET, REGISTER_EX, REGISTER_I),
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_X), 0x0332,	
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_Y), 0xF445,	// 
			Utils.makeInstruction(OPERATION_DVI, REGISTER_X, REGISTER_Y)							// X = 0x4c, EX=0x723a
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0xFFF2, "Register B is quotient of B and A");
		equal(e.Registers.I.get(), 0x5556, "Register I shows overflow from first operation");
		equal(e.Registers.Y.get(),  0xFFFD, "Register Y is quotient of 0xD8F0 and 0xEB20");
		//equal(e.Registers.EX.get(), 0x723a, "Register EX shows overflow");
	});
	
	test("MOD Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,		
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x0f,		// 15
			Utils.makeInstruction(OPERATION_MOD, REGISTER_A, REGISTER_B),							// B = 3
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_X), 0x13,		// 
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_Y), 0x3452,	// 
			Utils.makeInstruction(OPERATION_MOD, REGISTER_X, REGISTER_Y)							// X = 0x12
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 3, "Register B is result of B % A");
		equal(e.Registers.Y.get(),  0x12, "Register Y 0x3452 % 0x13");
	});
	
	test("MDI Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x10,		// -7	
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0xFFF9,	// 16
			Utils.makeInstruction(OPERATION_MDI, REGISTER_A, REGISTER_B),							// B = -7
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0xFFF9, "Register B is result of B % A");
	});
	
	test("AND Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0xff44,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x44ff,
			Utils.makeInstruction(OPERATION_AND, REGISTER_A, REGISTER_B),						
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0x4444, "Register B is result of B & A");
	});
	
	test("BOR Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x4444,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x3333,
			Utils.makeInstruction(OPERATION_BOR, REGISTER_A, REGISTER_B),						
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0x7777, "Register B is result of B | A");
	});
	
	test("XOR Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x3434,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x1111,
			Utils.makeInstruction(OPERATION_XOR, REGISTER_A, REGISTER_B),						
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0x2525, "Register B is result of B ^ A");
	});
	
	test("SHR Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0xFF11,
			Utils.makeInstruction(OPERATION_SHR, REGISTER_A, REGISTER_B),						
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0x0FF1, "Register B is result of B >>> A");
		equal(e.Registers.EX.get(), 0x1000, "Register EX shows overflow");
	});
	
	test("ASR Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0xFF11,
			Utils.makeInstruction(OPERATION_ASR, REGISTER_A, REGISTER_B),						
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0xFFF1, "Register B is result of B >> A");
		equal(e.Registers.EX.get(), 0x1000, "Register EX shows overflow");
	});
	
	test("SHL Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0xFF11,
			Utils.makeInstruction(OPERATION_SHL, REGISTER_A, REGISTER_B),						
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0xF110, "Register B is result of B << A");
		equal(e.Registers.EX.get(), 0x0f, "Register EX shows overflow");
	});
	
	// branching operations
	test("IFB Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0xffee,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x01,
			Utils.makeInstruction(OPERATION_IFB, REGISTER_B, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_0, REGISTER_B)
			
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0xffee, "B is 0xffee, instruction was skipped");
	});
	
	test("IFC Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0xffee,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeInstruction(OPERATION_IFC, REGISTER_B, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_0, REGISTER_B)
			
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0xffee, "B is 0xffee, instruction was skipped");
	});
	
	test("IFE Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0xffee,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeInstruction(OPERATION_SET, Literals.L_0, REGISTER_X),
			Utils.makeInstruction(OPERATION_IFE, REGISTER_B, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_0, REGISTER_B),
			Utils.makeInstruction(OPERATION_SET, Literals.L_1, REGISTER_I),
			Utils.makeInstruction(OPERATION_IFE, Literals.L_4, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_2, REGISTER_J),
			Utils.makeInstruction(OPERATION_IFE, Literals.L_5, REGISTER_A),
			Utils.makeInstruction(OPERATION_IFE, Literals.L_6, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_7, REGISTER_X)
			
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0xffee, "B is 0xffee, instruction was skipped");
		equal(e.Registers.I.get(), 1, "I is 1, instruction was not skipped");
		equal(e.Registers.J.get(), 2, "J is 2, instruction was not skipped");
		equal(e.Registers.X.get(), 0, "X is 0, instruction was skipped");
	});
	
	test("IFN Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0xffee,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0xffee,
			Utils.makeInstruction(OPERATION_IFN, REGISTER_B, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_0, REGISTER_B),
			Utils.makeInstruction(OPERATION_IFN, Literals.L_5, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_7, REGISTER_J)
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0xffee, "B is 0xffee, instruction was skipped");
		equal(e.Registers.J.get(), 7, "J is 7, instruction was not skipped");
	});
	
	test("IFG Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0xffee,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeInstruction(OPERATION_IFG, REGISTER_B, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_0, REGISTER_B)
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0xffee, "B is 0xffee, instruction was skipped");
	});
	
	test("IFA Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0xffee,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeInstruction(OPERATION_IFA, REGISTER_B, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_0, REGISTER_B)
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0, "B is 0, instruction was not skipped");
	});
	
	test("IFL Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x03,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeInstruction(OPERATION_IFL, REGISTER_B, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_0, REGISTER_B)
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0x03, "B is 0x03, instruction was skipped");
	});
	
	test("IFU Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x04,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0xff43,
			Utils.makeInstruction(OPERATION_IFU, REGISTER_B, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_0, REGISTER_B)
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0, "B is 0, instruction was not skipped");
	});
	
	test("ADX Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x05,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_EX), 0x06,
			Utils.makeInstruction(OPERATION_ADX, REGISTER_A, REGISTER_B),						
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_X), 0xee55,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_Y), 0xff44,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_EX), 0x06,
			Utils.makeInstruction(OPERATION_ADX, REGISTER_X, REGISTER_Y),					
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0x0f, "Register B is result of A + B + EX");
		equal(e.Registers.Y.get(), 0xED9F, "Register Y is result of X + Y + EX");
		equal(e.Registers.EX.get(), 0x01, "Register EX shows overflow");
	});
	
	test("SBX Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x05,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_EX), 0x06,
			Utils.makeInstruction(OPERATION_SBX, REGISTER_A, REGISTER_B),						
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_X), 0xff44,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_Y), 0xee55,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_EX), 0x06,
			Utils.makeInstruction(OPERATION_SBX, REGISTER_X, REGISTER_Y),					
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.B.get(), 0x07, "Register B is result of B - A + EX");
		equal(e.Registers.Y.get(), 0xEF17, "Register Y is result of Y - X + EX");
		equal(e.Registers.EX.get(), 0xffff, "Register EX shows underflow");
	});
	
	test("STI Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x05,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_I), 0x06,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_J), 0x07,
			Utils.makeInstruction(OPERATION_STI, REGISTER_A, REGISTER_B),						
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.A.get(), 0x05, "Register A is set to B");
		equal(e.Registers.B.get(), 0x04, "Register B is set to A");
		equal(e.Registers.I.get(), 0x07, "Register I has been incremented");
		equal(e.Registers.J.get(), 0x08, "Register J has been incremented");
	});
	
	test("STD Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x05,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_I), 0x06,
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_J), 0x00,
			Utils.makeInstruction(OPERATION_STD, REGISTER_A, REGISTER_B),						
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.A.get(), 0x05, "Register A is set to B");
		equal(e.Registers.B.get(), 0x04, "Register B is set to A");
		equal(e.Registers.I.get(), 0x05, "Register I has been decremented");
		equal(e.Registers.J.get(), 0xffff, "Register J has been decremented");
	});
	
	test("JSR Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x04,
			Utils.makeSpecialInstruction(OPERATION_JSR, Values.NEXT_WORD_LITERAL), 0x08,		//  jump to 0x8
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x05,
			Utils.makeInstruction(OPERATION_IFE, Literals.L_5, REGISTER_A),
			Utils.makeInstruction(OPERATION_SET, Literals.L_16, REGISTER_PC),					// exit
			
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_A), 0x03,	// 0x8
			Utils.makeInstruction(OPERATION_SET, Values.SP_OFFSET, REGISTER_PC)				// return
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.A.get(), 0x05, "Register A is set to 5");
	});
	
	test("Interrupt Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeInstruction(OPERATION_SET, Values.NEXT_WORD_LITERAL, REGISTER_B), 0x06,
			Utils.makeSpecialInstruction(OPERATION_IAS, REGISTER_B), 
			Utils.makeSpecialInstruction(OPERATION_INT, Values.NEXT_WORD_LITERAL), 0x08,
			Utils.makeInstruction(OPERATION_SET, Literals.L_16, REGISTER_PC),				// exit
			Utils.makeInstruction(OPERATION_SET, Literals.L_0, REGISTER_C),				// 0x06
			Utils.makeSpecialInstruction(OPERATION_IAG, REGISTER_Y), 						// Y = 6
			Utils.makeSpecialInstruction(OPERATION_IAS, REGISTER_C), 						// IA = 0
			Utils.makeInstruction(OPERATION_SET, REGISTER_A, REGISTER_X),					// X = 8 (INT message)
			Utils.makeSpecialInstruction(OPERATION_RFI, Literals.L_0),						// return
			
		];
		
		var e = new Emulator();
		e.run(program);
		
		equal(e.Registers.IA.get(), 0x00, "Register IA is set to 0");
		equal(e.Registers.X.get(), 0x08, "Register X is set to 8");
		equal(e.Registers.Y.get(), 0x06, "Register Y is set to 6");
	});
	
	test("Hardware Test", function() { 
		//expect(1);
		
		var program = [
			Utils.makeSpecialInstruction(OPERATION_HWN, REGISTER_I), 
			Utils.makeSpecialInstruction(OPERATION_HWQ, Literals.L_0), 
			Utils.makeSpecialInstruction(OPERATION_HWI, Literals.L_0), 
		];
		
		var e = new Emulator();
		e.devices.push(new Device(0xdeadbeef, 0x21, 0xfeeddeee));
		e.run(program);
		
		equal(e.Registers.I.get(), 1, "Register I is set to 1");
		equal(e.Registers.A.get(), 0xbeef, "Register A is set to 0xbeef");
		equal(e.Registers.B.get(), 0xdead, "Register B is set to 0xdead");
		equal(e.Registers.C.get(), 0x21, "Register C is set to 0x21");
		equal(e.Registers.X.get(), 0xdeee, "Register X is set to 0xdeee");
		equal(e.Registers.Y.get(), 0xfeed, "Register Y is set to 0xfeed");
		
	});
	
	module("Tokenizer Module");
	
	test("Basic Tokens Test", function() { 
		var input = "; some comment for the code \n" +
					 "ADD A, 0x1234\n" +
					 ":my_label dat 1234 0x9876\n" +
					 "  SUB [ 4 * 4 ] ; do some math \n" +
					 "JSR imy_label\n" +
					 "dat \"my string\", 0";
		
		var lines = Tokenizer.tokenize(input);
		equal(lines.length, 6, "6 lines tokenized");
		equal(lines[0][0].type, "comment", "Line 1 comment");
		equal(lines[1][0].type, "command", "Line 2 command");
		equal(lines[1][2].type, "register", "Line 2 register");
		equal(lines[1][3].type, "comma", "Line 2 comma");
		equal(lines[1][5].type, "hexidecimal", "Line 2 hexidecimal");
		equal(lines[2][0].type, "label_def", "Line 3 label_def");
		equal(lines[2][2].type, "reserved_word", "Line 3 reserved_word");
		equal(lines[2][4].type, "decimal", "Line 3 decmial");
		equal(lines[3][1].type, "command", "Line 4 command");
		equal(lines[3][3].type, "open_bracket", "Line 4 open_bracket");
		equal(lines[3][7].type, "operator", "Line 4 operator");
		equal(lines[3][11].type, "close_bracket", "Line 4 close_bracket");
		equal(lines[3][13].type, "comment", "Line 4 comment");
		equal(lines[4][2].type, "label_ref", "Line 5 label_ref");
		equal(lines[5][2].type, "string", "Line 6 string");
		equal(lines[5][3].type, "comma", "Line 6 comma");
		
		
	});
	
	test("Invalid Token Test", function() { 
		raises(function() {
			Tokenizer.tokenize("(*&^%$#HDBGFDAS");
		}, "Test invalid token");
	});
	
	
};

