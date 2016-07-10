/*
Copyright (c) 2011, Gerhard H. Schalk (www.smartcard-magic.net)
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the 
documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT 
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT 
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT 
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON 
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE 
USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
#include <winscard.h>
#include <stdio.h>
#include <conio.h>
#include <string.h>
#include "../header/pcsc.h"
#include "../header/util.h"

#define RcvLenMax 300l                       // Max. APDU Buffer length.

SCARDCONTEXT		m_hContext;				 // Resource manager handle 
SCARDHANDLE			m_hCard;				 // Card Handle
CHAR				m_szSelectedReader[256];  // Selected card reader name.
DWORD				m_dwActiveProtocol;      // Active protocol (T=0, T=1 or undefined).

/*************************************************
Function:       PCSC_Connect       
Description:
     Establishes the resource manager context.
Parameter:
     sReader   If the value is NULL a list all 
               readers in the system is displayed 
               for selection. Alternative a specific
               reader name string must be provided.
     
Return:
     LONG   If the function succeeds, the function 
            If the function fails,it returns an 
            SCARD error code.
**************************************************/
LONG PCSC_Connect(LPTSTR szReader  )
{
	LONG			lRetValue;
	LPTSTR          pmszReaders = NULL;
	LPTSTR          pszReader;
	LPTSTR			pszaReaders[16];
	DWORD           cch = SCARD_AUTOALLOCATE;
	INT				iNumberOfReaders;
	INT				iSelectedReader;
    
    // The SCardEstablishContext function establishes the resource manager context 
	lRetValue = SCardEstablishContext(
                   SCARD_SCOPE_USER, // Scope of the resource manager context.
                   NULL,             // r.f.u
                   NULL,             // r.f.u
                   &m_hContext);	 // Returns the resource manager handle.
	PCSC_STATUS(lRetValue,"SCardEstablishContext");	

	if(szReader  != NULL)
	{
		strcpy_s(m_szSelectedReader, szReader );
		return lRetValue;
	}

	// The SCardListReaders function provides the list of readers 
	lRetValue = SCardListReaders(
                    m_hContext,             // Resource manager handle. 
                    NULL, // NULL: list all readers in the system 
                    (LPTSTR)&pmszReaders, // Returs the card readers list.
                    &cch );
	PCSC_STATUS(lRetValue,"SCardListReaders");
		
	iNumberOfReaders = 0;
	pszReader = pmszReaders;

	// Extract the reader strings form the null separated string and 
	// get the total number of readers.
	while ( *pszReader != '\0' )
	{
		printf("\n      Reader [%2d] %s", iNumberOfReaders, pszReader);
		pszaReaders[ iNumberOfReaders ] = (LPTSTR)pszReader;
		pszReader = pszReader + strlen(pszReader) + 1;
		iNumberOfReaders++;
	}
	
	if( iNumberOfReaders > 1)
	{
		// There are several readers connected.
		printf("\n      Please select a reader (0..n): ");
		fflush(stdin);
		
		iSelectedReader = _getch() - '0';
		printf("%d\n",iSelectedReader);
		strcpy_s(m_szSelectedReader, pszaReaders[iSelectedReader]);
	}
	else
	{
		// There is only one reader connected.
		strcpy_s(m_szSelectedReader, pszaReaders[0]);	
	}

	// Releases memory that has been returned from the resource manager 
    // using the SCARD_AUTOALLOCATE length designator.
	lRetValue = SCardFreeMemory( m_hContext, pmszReaders );
	PCSC_ERROR(lRetValue, "SCardFreeMemory");
	return lRetValue;

}

LONG PCSC_WaitForCardPresent(void)
{
    SCARD_READERSTATE sReaderState;
    LONG lRetValue;

    sReaderState.szReader = m_szSelectedReader;
    sReaderState.dwCurrentState = SCARD_STATE_UNAWARE;
    sReaderState.dwEventState = SCARD_STATE_UNAWARE;
    
    //The SCardGetStatusChange function blocks execution until the current 
    //availability of the cards in a specific set of readers changes.
    lRetValue = SCardGetStatusChange(
                    m_hContext,     // Resource manager handle.
                    30, //Max. amount of time (in milliseconds) to wait for an action.
                    &sReaderState,  // Reader state
                    1);             // Number of readers
    PCSC_STATUS(lRetValue,"SCardGetStatusChange");	    
    
    // Check if card is already present
    if((sReaderState.dwEventState & SCARD_STATE_PRESENT) == SCARD_STATE_PRESENT)
    {
        printf(": Card present...\n");
    }
    else
    {
        printf(": Wait for card...\n");

        // wait for card
        do
        {
            lRetValue = SCardGetStatusChange(m_hContext,30,&sReaderState,1);
            PCSC_ERROR(lRetValue, "SCardGetStatusChange");
            Sleep(100);
        }
        while((sReaderState.dwEventState & SCARD_STATE_PRESENT) == 0);    
    }
    
    return lRetValue;
}

LONG PCSC_WaitForCardRemoval(void)
{
    SCARD_READERSTATE sReaderState;
    LONG lRetValue;

    sReaderState.szReader = m_szSelectedReader;
    sReaderState.dwCurrentState = SCARD_STATE_UNAWARE;
    sReaderState.dwEventState = SCARD_STATE_UNAWARE;
    
    //The SCardGetStatusChange function blocks execution until the current 
    //availability of the cards in a specific set of readers changes.
    lRetValue = SCardGetStatusChange(
                    m_hContext,     // Resource manager handle.
                    30, //Max. amount of time (in milliseconds) to wait for an action.
                    &sReaderState,  // Reader state
                    1);             // Number of readers
    PCSC_STATUS(lRetValue,"SCardGetStatusChange");	    
    
    // Check if card is already present
    if((sReaderState.dwEventState & SCARD_STATE_EMPTY) == SCARD_STATE_EMPTY)
    {
        printf(": Card removed...\n");
    }
    else
    {
        printf(": Wait until card is removed...\n");

        // wait for card
        do
        {
            lRetValue = SCardGetStatusChange(m_hContext,30,&sReaderState,1);
            PCSC_ERROR(lRetValue, "SCardGetStatusChange");
            Sleep(100);
        }
        while((sReaderState.dwEventState & SCARD_STATE_EMPTY) == 0);    
    }
    
    return lRetValue;
}
//SCARD_STATE_EMPTY

LONG PCSC_ActivateCard(void)
{

	LONG			lRetValue;
    
    //Establishes a connection to a smart card contained by a specific reader.
	lRetValue = SCardConnect( 
                    m_hContext, // Resource manager handle.
					m_szSelectedReader,     // Reader name.
					SCARD_SHARE_EXCLUSIVE,  // Share Mode.
					SCARD_PROTOCOL_Tx, //Preferred protocols (T=0 or T=1).
					&m_hCard,               // Returns the card handle.
					&m_dwActiveProtocol);   // Active protocol.
	PCSC_STATUS(lRetValue,"SCardConnect");	

	switch(m_dwActiveProtocol)
	{
		case SCARD_PROTOCOL_T0:
			printf(": Card Activated via  T=0 protocol");
			break;

		case SCARD_PROTOCOL_T1:
			printf(": Card Activated via  T=1 protocol");
			break;

		case SCARD_PROTOCOL_UNDEFINED:
			printf(": ERROR: Active protocol unnegotiated or unknown");
			lRetValue = -1;
			break;	
	}
	return lRetValue;
}


LONG PCSC_Exchange(LPCBYTE pbSendBuffer ,DWORD  cbSendLength ,LPBYTE  pbRecvBuffer ,LPDWORD pcbRecvLength )
{	
	
	LPCSCARD_IO_REQUEST  ioRequest;
	LONG	 lRetValue;

	switch (m_dwActiveProtocol)
	{
		case SCARD_PROTOCOL_T0:
			ioRequest = SCARD_PCI_T0;
			break;

		case SCARD_PROTOCOL_T1:
			ioRequest = SCARD_PCI_T1;
			break;

		default:
			ioRequest = SCARD_PCI_RAW;
			break;
	}
	
	*pcbRecvLength = RcvLenMax;

    // APDU exchange.
	lRetValue = SCardTransmit(m_hCard,		// Card handle.
							ioRequest,		// Pointer to the send protocol header.
							pbSendBuffer,	// Send buffer.
							cbSendLength,	// Send buffer length.
							NULL,			// Pointer to the rec. protocol header.
							pbRecvBuffer,	// Receive buffer.
							pcbRecvLength);	// Receive buffer length.
	PCSC_STATUS(lRetValue,"SCardTransmit");	
	
    printHexString("\n   --> C-Apdu: 0x",(LPBYTE)pbSendBuffer, cbSendLength);	
	printHexString("   <-- R-Apdu: 0x",pbRecvBuffer, *pcbRecvLength);
	printf("       SW1SW2: 0x%02X%02X\n\n",pbRecvBuffer[*pcbRecvLength - 2], pbRecvBuffer[*pcbRecvLength - 1]); 
	return lRetValue;		
}


LONG PCSC_Disconnect(void)
{
	long lRetValue;
	
	// Terminates the smart card connection.
	lRetValue  = SCardDisconnect(
                    m_hCard,            // Card handle.
                    SCARD_UNPOWER_CARD);// Action to take on the card
                                        // in the connected reader on close. 
	PCSC_STATUS(lRetValue,"SCardDisconnect");	
	
	// Release the Resource Manager Context.
	lRetValue =	SCardReleaseContext(m_hContext);	
	m_hContext = 0;
	return lRetValue;
}


LONG PCSC_GetVentorName()
{
	LPBYTE   pbAttr = NULL;
	DWORD    cByte = SCARD_AUTOALLOCATE;
	DWORD    i;
	LONG	 lRetValue;
    
    // Gets the current reader attributes for the given handle.
	lRetValue = SCardGetAttrib(
                    m_hCard,  // Card handle.
					SCARD_ATTR_VENDOR_NAME, // Attribute identifier.
					(LPBYTE)&pbAttr,    // Attribute buffer.
					&cByte);            // Returned attribute length.
	PCSC_STATUS(lRetValue,"SCardGetAttrib (VENDOR_NAME)");
	
	// Output the bytes.
	for (i = 0; i < cByte; i++)
		printf("%c", *(pbAttr+i));
	printf("\n");
	
	// Releases memory that has been returned from the resource manager 
    // using the SCARD_AUTOALLOCATE length designator.
	lRetValue = SCardFreeMemory( m_hContext, pbAttr );
	PCSC_ERROR(lRetValue, "SCardFreeMemory");

	return lRetValue;
}


LONG PCSC_GetAtrString(LPBYTE atr, LPINT atrLen)
{
	LPBYTE   pbAttr = NULL;
	DWORD    cByte = SCARD_AUTOALLOCATE;
	LONG	 lRetValue;

    // Gets the current reader attributes for the given handle.
	lRetValue = SCardGetAttrib(
                    m_hCard, // Card handle.
					SCARD_ATTR_ATR_STRING,// Attribute identifier.
					(LPBYTE)&pbAttr,  // Attribute buffer.
					&cByte);          // Returned attribute length.
	PCSC_ERROR(lRetValue,"SCardGetAttrib (ATR_STRING)");
	
	printHexString("\n      Atr: 0x",(LPBYTE)pbAttr, cByte);

	if(atr != NULL)
	{
		copyByte(atr, pbAttr, cByte);
		*atrLen = cByte;
	}

	// Releases memory that has been returned from the resource manager 
    // using the SCARD_AUTOALLOCATE length designator.
	lRetValue = SCardFreeMemory( m_hContext, pbAttr );
	PCSC_ERROR(lRetValue, "SCardFreeMemory");

	return lRetValue;
}