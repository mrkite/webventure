function disassemble(file)
{
	var p=file;
	var ch;
	var offset=0;
	var out="";

	function push(x) { out+=" &#10139;"+x; }
	function pop(x) { out+=" ("+x+")"; }

	while (!p.eof())
	{
		out+=four(offset)+": ";
		ch=p.r8(); offset++;
		if (!(ch&0x80))
		{
			out+="push";
			push("$"+two(ch));
			out+="\n";
			continue;
		}
		switch (ch)
		{
		case 0x80:
			out+="get_attr"
			pop("obj");
			pop("attr");
			push("result");
			break;
		case 0x81:
			out+="set_attr";
			pop("obj");
			pop("attr");
			pop("value");
			break;
		case 0x82:
			out+="sum_children";
			pop("obj");
			pop("attr");
			pop("recursive");
			push("result");
			break;
		case 0x83:
			out+="push";
			push("selected_command");
			break;
		case 0x84:
			out+="push";
			push("selected_object");
			break;
		case 0x85:
			out+="push";
			push("target");
			break;
		case 0x86:
			out+="push";
			push("delta_x");
			break;
		case 0x87:
			out+="push";
			push("delta_y");
			break;
		case 0x88:
			out+="push";
			push("$"+two(p.r8()));  offset++;
			break;
		case 0x89:
			out+="push";
			push("$"+four(p.r16())); offset+=2;
			break;
		case 0x8a:
			out+="get_global";
			pop("index");
			push("result");
			break;
		case 0x8b:
			out+="set_global";
			pop("index");
			pop("value");
			break;
		case 0x8c:
			out+="random";
			pop("max");
			push("result");
			break;
		case 0x8d:
			out+="copy";
			push("stack[0]");
			break;
		case 0x8e:
			out+="copyn";
			pop("num");
			push("stack[num-1]");
			push("stack[num-2]");
			push("...");
			break;
		case 0x8f:
			out+="swap";
			pop("a");
			pop("b");
			push("b");
			push("a");
			break;
		case 0x90:
			out+="swapn";
			pop("index");
			break;
		case 0x91:
			out+="pop";
			pop("trash");
			break;
		case 0x92:
			out+="copy+1";
			push("stack[1]");
			break;
		case 0x93:
			out+="copy+n";
			pop("index");
			push("stack[index]");
			break;
		case 0x94:
			out+="shuffle";
			pop("a");
			pop("b");
			pop("c");
			push("a");
			push("c");
			push("b");
			break;
		case 0x95:
			out+="sort";
			pop("step");
			pop("num");
			break;
		case 0x96:
			out+="clear_stack";
			break;
		case 0x97:
			out+="stack_size";
			push("size");
			break;
		case 0x98:
			out+="add";
			pop("b");
			pop("a");
			push("a+b");
			break;
		case 0x99:
			out+="sub";
			pop("b");
			pop("a");
			push("a-b");
			break;
		case 0x9a:
			out+="mul";
			pop("b");
			pop("a");
			push("a*b");
			break;
		case 0x9b:
			out+="div";
			pop("b");
			pop("a");
			push("a/b");
			break;
		case 0x9c:
			out+="mod";
			pop("b");
			pop("a");
			push("a%b");
			break;
		case 0x9d:
			out+="divmod";
			pop("b");
			pop("a");
			push("a%b");
			push("a/b");
			break;
		case 0x9e:
			out+="abs";
			pop("val");
			push("result");
			break;
		case 0x9f:
			out+="neg";
			pop("val");
			push("-val");
			break;
		case 0xa0:
			out+="and";
			pop("b");
			pop("a");
			push("a&amp;b");
			break;
		case 0xa1:
			out+="or";
			pop("b");
			pop("a");
			push("a|b");
			break;
		case 0xa2:
			out+="xor";
			pop("b");
			pop("a");
			push("a^b");
			break;
		case 0xa3:
			out+="not";
			pop("val");
			push("~val");
			break;
		case 0xa4:
			out+="log_and";
			pop("b");
			pop("a");
			push("a && b");
			break;
		case 0xa5:
			out+="log_or";
			pop("b");
			pop("a");
			push("a || b");
			break;
		case 0xa6:
			out+="log_xor";
			pop("b");
			pop("a");
			push("!a != !b");
			break;
		case 0xa7:
			out+="log_not";
			pop("val");
			push("!val");
			break;
		case 0xa8:
			out+="gtu";
			pop("b");
			pop("a");
			push("a&gt;b");
			break;
		case 0xa9:
			out+="ltu";
			pop("b");
			pop("a");
			push("a&lt;b");
			break;
		case 0xaa:
			out+="gt";
			pop("b");
			pop("a");
			push("a&gt;b");
			break;
		case 0xab:
			out+="lt";
			pop("b");
			pop("a");
			push("a&lt;b");
			break;
		case 0xac:
			out+="eq";
			pop("b");
			pop("a");
			push("a==b");
			break;
		case 0xad:
			out+="str_eq";
			pop("b");
			pop("a");
			push("a==b");
			break;
		case 0xae:
			out+="contains";
			pop("needle");
			pop("haystack");
			push("result");
			break;
		case 0xaf:
			out+="contains_word";
			pop("needle");
			pop("haystack");
			push("result");
			break;
		case 0xb0:
			delta=neg16(p.r16()); offset+=2;
			out+="bra $"+four(offset+delta);
			break;
		case 0xb1:
			delta=neg8(p.r8()); offset++;
			out+="bra $"+four(offset+delta);
			break;
		case 0xb2:
			delta=neg16(p.r16()); offset+=2;
			out+="bt $"+four(offset+delta);
			pop("bool");
			break;
		case 0xb3:
			delta=neg8(p.r8()); offset++;
			out+="bt $"+four(offset+delta);
			pop("bool");
			break;
		case 0xb4:
			delta=neg16(p.r16()); offset+=2;
			out+="bf $"+four(offset+delta);
			pop("bool");
			break;
		case 0xb5:
			delta=neg8(p.r8()); offset++;
			out+="bf $"+four(offset+delta);
			pop("bool");
			break;
		case 0xb6:
			out+="call_later";
			pop("rank");
			pop("function");
			break;
		case 0xb7:
			out+="cancel_call";
			pop("function");
			break;
		case 0xb8:
			out+="cancel_lower";
			pop("rank");
			break;
		case 0xb9:
			out+="cancel_higher";
			pop("rank");
			break;
		case 0xba:
			out+="cancel_between";
			pop("rank");
			pop("rank");
			break;
		case 0xbb:
			out+="fork";
			pop("selected_control");
			pop("selected_object");
			pop("target");
			pop("delta_x");
			pop("delta_y");
			break;
		case 0xbc:
			out+="call";
			pop("function");
			break;
		case 0xbd:
			out+="focus";
			pop("object_id");
			break;
		case 0xbe:
			out+="swap_object";
			pop("from");
			pop("to");
			break;
		case 0xbf:
			out+="snap_object";
			break;
		case 0xc0:
			out+="toggle_exits";
			break;
		case 0xc1:
			out+="print";
			pop("text_id");
			break;
		case 0xc2:
			out+="newline";
			break;
		case 0xc3:
			out+="print_nl";
			pop("text_id");
			break;
		case 0xc4:
			out+="print_para";
			pop("text_id");
			break;
		case 0xc5:
			out+="print";
			pop("number");
			break;
		case 0xc6:
			out+="push_unknown";
			push("$2");
			break;
		case 0xc7:
			out+="play_bg_sound";
			pop("id");
			break;
		case 0xc8:
			out+="play_sound";
			pop("id");
			break;
		case 0xc9:
			out+="wait_sound";
			break;
		case 0xca:
			out+="time";
			push("year");
			push("month");
			push("day");
			push("hour");
			push("minute");
			push("second");
			break;
		case 0xcb:
			out+="get_day";
			push("dotw");
			break;
		case 0xcc:
			out+="get_children";
			pop("recurs");
			pop("object");
			push("child[0]");
			push("child[1]");
			push("...");
			push("num_children");
			break;
		case 0xcd:
			out+="count_children";
			pop("recurs");
			pop("object");
			push("num_children");
			break;
		case 0xce:
			out+="push_engine";
			push("$56");
			break;
		case 0xcf:
			out+="push_scenario";
			push("$3");
			break;
		case 0xd0:
			out+="push_unknown";
			push("$1");
			break;
		case 0xd1:
			out+="get_obj_dimensions";
			pop("object");
			push("width");
			push("height");
			break;
		case 0xd2:
			out+="get_overlap";
			pop("object_b");
			pop("object_a");
			push("overlap_percent");
			break;
		case 0xd3:
			out+="capture_children";
			pop("object");
			break;
		case 0xd4:
			out+="release_children";
			pop("object");
			break;
		case 0xd5:
			out+="do_text_entry";
			pop("text");
			push("okayHit");
			break;
		case 0xd6:
			out+="activate_command";
			pop("command");
			break;
		case 0xd7:
			out+="lose";
			break;
		case 0xd8:
			out+="win";
			break;
		case 0xd9:
			out+="sleep";
			pop("ticks");
			break;
		case 0xda:
			out+="pause";
			break;
		case 0xdb:
			out+="flush_queue";
			break;
		case 0xdc:
			out+="flush_sounds";
			break;
		case 0xdd:
			out+="flush_text";
			break;
		case 0xde:
			out+="update_screen";
			break;
		case 0xdf:
			out+="flash_window";
			pop("time");
			break;
		case 0xe0:
			out+="preload_graphic";
			pop("id");
			break;
		case 0xe1:
			out+="preload_sound";
			pop("id");
			break;
		case 0xe2:
			out+="muldiv";
			pop("b");
			pop("a");
			pop("c");
			push("a*b/c");
			break;
		case 0xe3:
			out+="update_object";
			pop("id");
			break;
		case 0xe4:
			out+="is_event";
			push("0");
			break;
		case 0xe5:
			out+="wait_event";
			break;
		case 0xe6:
			out+="get_fib";
			push("result");
			break;
		case 0xe7:
			out+="calc_fib";
			pop("index");
			break;
		default:
			throw "Unknown function: "+ch.toString(16);
		}
		out+="\n";
	}
	return out;
}
