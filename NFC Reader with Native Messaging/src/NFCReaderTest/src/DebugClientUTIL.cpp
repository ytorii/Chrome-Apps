//////////////////////////////////////////////////////////////////////////////
//         Copyright (c), Philips Semiconductors
//
//                     (C)PHILIPS Electronics N.V.2002
//       All rights are reserved. Reproduction in whole or in part is 
//      prohibited without the written consent of the copyright owner.
//  Philips reserves the right to make changes without notice at any time.
// Philips makes no warranty, expressed, implied or statutory, including but
// not limited to any implied warranty of merchantability or fitness for any
//particular purpose, or that the use will not infringe any third party patent,
// copyright or trademark. Philips must not be liable for any loss or damage
//                          arising from its use.
//////////////////////////////////////////////////////////////////////////////
//
// Project:	Util functions which shows how to use the DebugClient
//
//////////////////////////////////////////////////////////////////////////////
#include <windows.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>

static HWND hwndDbg;

//---------------------------------------------------------------------------
//	Check if Debug Client Window is present
//---------------------------------------------------------------------------
void SearchDebugClient(void)
{
	hwndDbg = FindWindow(NULL, "Debugclient");
}


//---------------------------------------------------------------------------
//	This function sends a message to the Debug Client
//---------------------------------------------------------------------------
void SndDbgMsg(const char *buf)
{
  static COPYDATASTRUCT cd;

  if(hwndDbg)
  {
    //fill COPYDATA
    cd.lpData = (void *) buf;
    cd.cbData = strlen(buf) + 1;
    cd.dwData = 0xdeadbeef;

    //send, blocks if Debugclient is in SingleStepping mode
    SendMessage(hwndDbg, WM_COPYDATA, (WPARAM) NULL, (LPARAM) &cd);
  }
}


//---------------------------------------------------------------------------
//	This function sends the content of the Responce Buffer to Debug Client
//---------------------------------------------------------------------------
void DbgprintRespBuf(unsigned char *pRespBuf,	unsigned short RespLen)
{	
	unsigned int i,j;
	char dbgout[10000];

	j=0;
	j+=sprintf(dbgout+j,"Receive:");
	for(i=0;i<RespLen;i++)
	{	

		j+=	sprintf(dbgout+j,"%02X ",pRespBuf[i]);
	}
	SndDbgMsg(dbgout);
	SndDbgMsg("\n\n");
}


//---------------------------------------------------------------------------
//	This function sends formatted data like printf to Debug Client.
//---------------------------------------------------------------------------
void Dbgprintf(const char *fmt,...)
{
   char sDbgOut[1000];
   unsigned int j=0;
   va_list args;	

   va_start(args,fmt);

   j+=vsprintf(sDbgOut+j,fmt,args);

   SndDbgMsg(sDbgOut);
   
   va_end(args);

 }